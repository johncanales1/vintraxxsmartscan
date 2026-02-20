// Authentication Service for VinTraxx SmartScan

// OTP-based email verification flow

import { logger, LogCategory } from '../../utils/Logger';

import { storageService } from '../storage/StorageService';

import { debugLogger } from '../debug/DebugLogger';

import { API_CONFIG, AUTH_ENDPOINTS } from '../../config/api';

import type {

  CheckEmailResponse,

  SendOtpResponse,

  VerifyOtpResponse,

  RegisterResponse as ApiRegisterResponse,

  LoginResponse as ApiLoginResponse,

} from '../../types/api';



export interface User {

  id: string;

  email: string;

  token: string;

  deviceSetupCompleted: boolean;

  deviceName?: string;

  createdAt: Date;

  lastLoginAt: Date;

}



export interface AuthResponse {

  success: boolean;

  user?: User;

  token?: string;

  message?: string;

  isRegistered?: boolean;

}



export interface OBDDevice {

  id: string;

  name: string;

  macAddress?: string;

  setupCompletedAt?: Date;

}

export interface AuthApiTraceEntry {
  timestamp: number;
  endpoint: string;
  url: string;
  method: 'POST';
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  responseStatus?: number;
  responseOk?: boolean;
  response?: unknown;
  error?: string;
  durationMs?: number;
}



class AuthService {

  private static instance: AuthService;

  private currentUser: User | null = null;

  private authToken: string | null = null;

  private userDevice: OBDDevice | null = null;

  private apiTrace: AuthApiTraceEntry[] = [];



  private constructor() {

    this.loadStoredAuth();

  }

  startApiTrace(): void {
    this.apiTrace = [];
  }

  getApiTrace(): AuthApiTraceEntry[] {
    return [...this.apiTrace];
  }

  exportApiTrace(): string {
    return this.apiTrace
      .map(entry => {
        const ts = new Date(entry.timestamp).toISOString();
        const status = typeof entry.responseStatus === 'number' ? ` HTTP ${entry.responseStatus}` : '';
        const duration = typeof entry.durationMs === 'number' ? ` (${entry.durationMs}ms)` : '';
        const headerLine = `${ts} [AUTH] ${entry.method} ${entry.url}${status}${duration}`;
        const headers = `headers=${JSON.stringify(entry.requestHeaders)}`;
        const body = `body=${JSON.stringify(entry.requestBody)}`;
        const response = typeof entry.response !== 'undefined' ? `response=${JSON.stringify(entry.response)}` : '';
        const error = entry.error ? `error=${JSON.stringify(entry.error)}` : '';
        return [headerLine, headers, body, response, error].filter(Boolean).join('\n');
      })
      .join('\n\n');
  }

  private sanitizeAny(value: unknown): unknown {
    const redactKeys = new Set([
      'password',
      'otp',
      'token',
      'accessToken',
      'refreshToken',
      'verificationToken',
      'authorization',
      'Authorization',
    ]);

    if (value === null || typeof value === 'undefined') return value;
    if (typeof value !== 'object') return value;

    if (Array.isArray(value)) {
      return value.map(v => this.sanitizeAny(v));
    }

    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (redactKeys.has(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = this.sanitizeAny(v);
      }
    }
    return out;
  }



  static getInstance(): AuthService {

    if (!AuthService.instance) {

      AuthService.instance = new AuthService();

    }

    return AuthService.instance;

  }



  private loadStoredAuth(): void {

    try {

      const settings = storageService.getSettings();

      if (settings.user && settings.authToken) {

        this.currentUser = settings.user;

        this.authToken = settings.authToken;

        this.userDevice = settings.userDevice || null;

        logger.info(LogCategory.APP, 'Loaded stored authentication');

        debugLogger.logEvent('Auth: Loaded stored session', { 

          email: settings.user?.email,

          hasToken: !!settings.authToken,

          deviceSetupCompleted: settings.user?.deviceSetupCompleted,

        });

      } else {

        debugLogger.logEvent('Auth: No stored session found');

      }

    } catch (error) {

      logger.error(LogCategory.APP, 'Failed to load stored auth', error);

      debugLogger.logError('Auth: Failed to load stored auth', error);

    }

  }



  /**

   * Clear all stored authentication data on app launch.

   * Used when "always require login on launch" is enabled.

   */

  clearAuthOnLaunch(): void {

    try {

      logger.info(LogCategory.APP, 'Clearing auth on launch (always require login)');

      debugLogger.logEvent('Auth: Clearing session on launch');



      this.currentUser = null;

      this.authToken = null;

      this.userDevice = null;



      const settings = storageService.getSettings();

      delete settings.user;

      delete settings.authToken;

      delete settings.userDevice;

      storageService.saveSettings(settings);



      logger.info(LogCategory.APP, 'Auth cleared on launch successfully');

      debugLogger.logEvent('Auth: Session cleared on launch');

    } catch (error) {

      logger.error(LogCategory.APP, 'Failed to clear auth on launch', error);

      debugLogger.logError('Auth: Failed to clear session on launch', error);

    }

  }



  private async apiCall<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {

    const controller = new AbortController();

    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);



    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const startTime = Date.now();

    const traceEntry: AuthApiTraceEntry = {
      timestamp: startTime,
      endpoint,
      url,
      method: 'POST',
      requestHeaders: {},
      requestBody: this.sanitizeAny(body),
    };

    this.apiTrace.push(traceEntry);
    if (this.apiTrace.length > 20) {
      this.apiTrace.shift();
    }



    try {

      const headers: Record<string, string> = {

        'Content-Type': 'application/json',

        Accept: 'application/json',

      };

      if (this.authToken) {

        headers['Authorization'] = `Bearer ${this.authToken}`;

      }



      const requestBody = JSON.stringify(body);

      traceEntry.requestHeaders = {
        ...headers,
        Authorization: headers.Authorization ? '[REDACTED]' : '',
      };



      // Log request details

      logger.info(LogCategory.API, `[AUTH] → ${endpoint}`, {

        url,

        method: 'POST',

        hasAuth: !!this.authToken,

        body: this.sanitizeAny(body),

      });



      let response: Response;

      try {

        response = await fetch(url, {

          method: 'POST',

          headers,

          body: requestBody,

          signal: controller.signal,

        });

      } catch (fetchError: any) {

        const duration = Date.now() - startTime;

        const isAbort = fetchError?.name === 'AbortError';

        logger.error(LogCategory.API, `[AUTH] ✗ ${endpoint} - ${isAbort ? 'TIMEOUT' : 'NETWORK ERROR'} (${duration}ms)`, {

          error: fetchError?.message || String(fetchError),

          isTimeout: isAbort,

        });

        traceEntry.durationMs = duration;
        traceEntry.error = fetchError?.message || String(fetchError);

        throw new Error(isAbort 

          ? 'Request timed out. Please check your connection.' 

          : `Network error: ${fetchError?.message || 'Unable to connect to server'}`

        );

      }



      const duration = Date.now() - startTime;



      // Log HTTP status

      logger.info(LogCategory.API, `[AUTH] ← ${endpoint} [${response.status}] (${duration}ms)`, {

        status: response.status,

        statusText: response.statusText,

        ok: response.ok,

      });

      traceEntry.durationMs = duration;
      traceEntry.responseStatus = response.status;
      traceEntry.responseOk = response.ok;



      const responseText = await response.text();

      let parsed: any;
      try {
        parsed = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        logger.error(LogCategory.API, `[AUTH] ✗ ${endpoint} - Failed to parse response as JSON`, {
          status: response.status,
          parseError: String(parseError),
          responsePreview: responseText?.slice(0, 500),
        });
        traceEntry.error = `Failed to parse JSON response (HTTP ${response.status})`;
        throw new Error(`Server returned invalid response (HTTP ${response.status})`);
      }

      traceEntry.response = this.sanitizeAny(parsed);

      if (!response.ok) {
        const serverMessage = typeof parsed?.message === 'string'
          ? parsed.message
          : typeof parsed?.error === 'string'
            ? parsed.error
            : '';

        const serverDetails = Array.isArray(parsed?.details)
          ? parsed.details.filter((d: unknown) => typeof d === 'string').join(', ')
          : '';

        const combinedMessage = serverDetails
          ? (serverMessage ? `${serverMessage}: ${serverDetails}` : serverDetails)
          : serverMessage;

        logger.error(LogCategory.API, `[AUTH] ✗ ${endpoint} - HTTP ${response.status}`, {
          status: response.status,
          statusText: response.statusText,
          serverMessage: combinedMessage,
          response: parsed,
        });

        traceEntry.error = combinedMessage || `Request failed (HTTP ${response.status})`;
        throw new Error(combinedMessage || `Request failed (HTTP ${response.status})`);
      }

      // Log response data

      logger.debug(LogCategory.API, `[AUTH] Response data: ${endpoint}`, { data: this.sanitizeAny(parsed) });

      return parsed as T;

    } finally {

      clearTimeout(timeoutId);

    }
  }




  /**

   * Check if email is already registered

   */

  async checkEmail(email: string): Promise<{ success: boolean; isRegistered: boolean; message?: string }> {

    try {

      logger.info(LogCategory.APP, `Checking email: ${email}`);

      const data = await this.apiCall<CheckEmailResponse>(AUTH_ENDPOINTS.CHECK_EMAIL, { email });



      if (data.success) {

        logger.info(LogCategory.APP, `Email check: isRegistered=${data.isRegistered}`);

        return { success: true, isRegistered: data.isRegistered };

      }

      const anyData = data as any;
      const message =
        (typeof anyData?.message === 'string' && anyData.message) ||
        (typeof anyData?.error === 'string' && anyData.error) ||
        (Array.isArray(anyData?.details) ? anyData.details.join(', ') : '') ||
        'Failed to check email.';

      return { success: false, isRegistered: false, message };

    } catch (error) {

      logger.error(LogCategory.APP, 'Check email error', error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, isRegistered: false, message };

    }

  }



  /**

   * Send OTP code to email

   */

  async sendOtp(email: string): Promise<{ success: boolean; message: string }> {

    try {

      logger.info(LogCategory.APP, `Sending OTP to: ${email}`);

      const data = await this.apiCall<SendOtpResponse>(AUTH_ENDPOINTS.SEND_OTP, { email });



      if (data.success) {

        logger.info(LogCategory.APP, 'OTP sent successfully');

        return { success: true, message: data.message || 'Verification code sent to your email.' };

      }

      const anyData = data as any;
      const message =
        data.message ||
        (typeof anyData?.error === 'string' && anyData.error) ||
        (Array.isArray(anyData?.details) ? anyData.details.join(', ') : '') ||
        'Failed to send verification code.';

      return { success: false, message };

    } catch (error) {

      logger.error(LogCategory.APP, 'Send OTP error', error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message };

    }

  }



  /**

   * Verify OTP code

   */

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {

    try {

      logger.info(LogCategory.APP, `Verifying OTP for: ${email}`);

      const data = await this.apiCall<VerifyOtpResponse>(AUTH_ENDPOINTS.VERIFY_OTP, { email, otp });



      if (data.success) {

        logger.info(LogCategory.APP, 'OTP verified successfully');

        return { success: true, message: data.message || 'Email verified successfully.' };

      }

      const anyData = data as any;
      const message =
        data.message ||
        (typeof anyData?.error === 'string' && anyData.error) ||
        (Array.isArray(anyData?.details) ? anyData.details.join(', ') : '') ||
        'Invalid or expired verification code.';

      return { success: false, message };

    } catch (error) {

      logger.error(LogCategory.APP, 'Verify OTP error', error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message };

    }

  }



  /**

   * Register a new user with email and password

   * Only allowed after OTP verification

   */

  async register(email: string, password: string): Promise<AuthResponse> {

    try {

      logger.info(LogCategory.APP, `Registering user: ${email}`);

      const data = await this.apiCall<ApiRegisterResponse>(AUTH_ENDPOINTS.REGISTER, { email, password });



      if (data.success && data.token) {

        const user: User = {

          id: data.user.id,

          email: data.user.email,

          token: data.token,

          deviceSetupCompleted: false,

          createdAt: new Date(),

          lastLoginAt: new Date(),

        };



        this.currentUser = user;

        this.authToken = data.token;

        this.persistAuth();



        logger.info(LogCategory.APP, 'Registration successful');

        return { success: true, user, token: data.token };

      }

      const anyData = data as any;
      const message =
        data.message ||
        (typeof anyData?.error === 'string' && anyData.error) ||
        (Array.isArray(anyData?.details) ? anyData.details.join(', ') : '') ||
        'Registration failed. Please try again.';

      return { success: false, message };

    } catch (error) {

      logger.error(LogCategory.APP, 'Registration error', error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message };

    }

  }



  /**

   * Login with email and password

   */

  async login(email: string, password: string): Promise<AuthResponse> {

    try {

      logger.info(LogCategory.APP, `Logging in: ${email}`);

      const data = await this.apiCall<ApiLoginResponse>(AUTH_ENDPOINTS.LOGIN, { email, password });



      if (data.success && data.token) {

        // Restore device setup state from stored settings for returning users

        const storedSettings = storageService.getSettings();

        const storedUser = storedSettings.user as User | undefined;

        const wasDeviceSetup = storedUser?.email === email

          ? storedUser.deviceSetupCompleted

          : false;



        const user: User = {

          id: data.user.id,

          email: data.user.email,

          token: data.token,

          deviceSetupCompleted: wasDeviceSetup,

          deviceName: storedUser?.email === email ? storedUser?.deviceName : undefined,

          createdAt: new Date(),

          lastLoginAt: new Date(),

        };



        this.currentUser = user;

        this.authToken = data.token;



        // Restore stored device if same user

        if (wasDeviceSetup && storedSettings.userDevice) {

          this.userDevice = storedSettings.userDevice;

        }



        this.persistAuth();



        logger.info(LogCategory.APP, `Login successful, deviceSetupCompleted=${wasDeviceSetup}`);

        return { success: true, user, token: data.token };

      }

      const anyData = data as any;
      const message =
        data.message ||
        (typeof anyData?.error === 'string' && anyData.error) ||
        (Array.isArray(anyData?.details) ? anyData.details.join(', ') : '') ||
        'Invalid credentials.';

      return { success: false, message };

    } catch (error) {

      logger.error(LogCategory.APP, 'Login error', error);

      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message };

    }

  }



  private persistAuth(): void {

    const settings = storageService.getSettings();

    storageService.saveSettings({

      ...settings,

      user: this.currentUser,

      authToken: this.authToken,

    });

  }



  async setupDevice(deviceName: string, macAddress?: string): Promise<boolean> {

    try {

      if (!this.currentUser) {

        logger.warn(LogCategory.APP, 'No user logged in for device setup');

        return false;

      }



      this.userDevice = {

        id: `device-${Date.now()}`,

        name: deviceName,

        macAddress: macAddress,

        setupCompletedAt: new Date(),

      };



      this.currentUser.deviceSetupCompleted = true;

      this.currentUser.deviceName = deviceName;



      const settings = storageService.getSettings();

      storageService.saveSettings({

        ...settings,

        user: this.currentUser,

        userDevice: this.userDevice,

      });



      logger.info(LogCategory.APP, `Device setup completed: ${deviceName}`);

      return true;

    } catch (error) {

      logger.error(LogCategory.APP, 'Device setup error', error);

      return false;

    }

  }



  getCurrentUser(): User | null {

    return this.currentUser;

  }



  getAuthToken(): string | null {

    return this.authToken;

  }



  getUserDevice(): OBDDevice | null {

    return this.userDevice;

  }



  isAuthenticated(): boolean {

    return this.currentUser !== null && this.authToken !== null;

  }



  isDeviceSetupCompleted(): boolean {

    return this.currentUser?.deviceSetupCompleted === true;

  }



  async logout(): Promise<void> {

    try {

      debugLogger.logEvent('Auth: Logout initiated');

      

      this.currentUser = null;

      this.authToken = null;

      this.userDevice = null;



      const settings = storageService.getSettings();

      delete settings.user;

      delete settings.authToken;

      delete settings.userDevice;

      storageService.saveSettings(settings);



      logger.info(LogCategory.APP, 'Logged out successfully');

      debugLogger.logEvent('Auth: Logout completed');

    } catch (error) {

      logger.error(LogCategory.APP, 'Logout error', error);

      debugLogger.logError('Auth: Logout failed', error);

    }

  }

}



export const authService = AuthService.getInstance();

