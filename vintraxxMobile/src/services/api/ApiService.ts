// API Service for VinTraxx SmartScan
// Handles scan submission, report polling, and history
import { logger, LogCategory } from '../../utils/Logger';
import { authService } from '../auth/AuthService';
import { API_CONFIG, SCAN_ENDPOINTS } from '../../config/api';
import type {
  ScanSubmissionPayload,
  ScanSubmitResponse,
  ReportPollResponse,
  FullReportData,
  ScanHistoryResponse,
  ScanHistoryItem,
} from '../../types/api';
import { ScanResult } from '../scanner/ScannerService';
import { kmToMiles } from '../obd/utils';

class ApiService {
  private static instance: ApiService;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = authService.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Build ScanSubmissionPayload from ScanResult (matches backend exactly)
   */
  buildScanPayload(scanResult: ScanResult): ScanSubmissionPayload {
    return {
      vin: scanResult.vin.valid ? scanResult.vin.vin : '',
      mileage: scanResult.odometer !== null ? kmToMiles(scanResult.odometer) : null,
      milStatus: {
        milOn: scanResult.milStatus.milOn,
        dtcCount: scanResult.milStatus.dtcCount,
        byEcu: scanResult.milStatusByEcu,
      },
      storedDtcCodes: scanResult.storedDtcs.map(d => d.code),
      pendingDtcCodes: scanResult.pendingDtcs.map(d => d.code),
      permanentDtcCodes: scanResult.permanentDtcs.map(d => d.code),
      distanceSinceCleared: scanResult.distanceSinceCleared !== null
        ? kmToMiles(scanResult.distanceSinceCleared) : null,
      timeSinceCleared: scanResult.timeSinceCleared,
      warmupsSinceCleared: scanResult.warmupsSinceCleared,
      distanceWithMILOn: scanResult.distanceWithMILOn !== null
        ? kmToMiles(scanResult.distanceWithMILOn) : null,
      fuelSystemStatus: scanResult.fuelSystemStatus,
      secondaryAirStatus: scanResult.secondaryAirStatus,
      scanDate: new Date().toISOString(),
    };
  }

  /**
   * Submit scan data to backend for AI processing
   * Returns scanId for polling
   */
  async submitScan(payload: ScanSubmissionPayload): Promise<{ success: boolean; scanId?: string; message?: string }> {
    try {
      if (!authService.isAuthenticated()) {
        logger.warn(LogCategory.APP, 'Scan submission failed: User not authenticated');
        return { success: false, message: 'Please log in to submit scan reports.' };
      }

      logger.info(LogCategory.APP, 'Submitting scan to backend');

      const url = `${API_CONFIG.BASE_URL}${SCAN_ENDPOINTS.SUBMIT}`;
      const requestHeaders = this.getAuthHeaders();
      const requestBody = JSON.stringify(payload);

      // Log request details
      logger.debug(LogCategory.API, 'API Request: submitScan', {
        url,
        method: 'POST',
        headers: { ...requestHeaders, Authorization: requestHeaders.Authorization ? '[REDACTED]' : undefined },
        payload,
      });

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: requestHeaders,
          body: requestBody,
        });
      } catch (fetchError) {
        // Network-level error (DNS failure, no internet, CORS, etc.)
        logger.error(LogCategory.APP, 'Scan submission network error', fetchError);
        return { 
          success: false, 
          message: 'Unable to connect to server. Please check your internet connection and try again.' 
        };
      }

      // Log response status
      logger.debug(LogCategory.API, 'API Response status: submitScan', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      // Handle HTTP error status codes
      if (!response.ok) {
        // Try to parse error response as JSON
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
          logger.warn(LogCategory.APP, 'Scan submission failed with HTTP error', {
            status: response.status,
            errorData,
          });
        } catch {
          // Response is not JSON (e.g., HTML error page, 502 gateway error)
          logger.warn(LogCategory.APP, 'Scan submission failed with non-JSON response', {
            status: response.status,
            statusText: response.statusText,
          });
          
          // Provide user-friendly messages for common HTTP errors
          if (response.status === 401) {
            errorMessage = 'Session expired. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'Access denied. Please check your account status.';
          } else if (response.status === 404) {
            errorMessage = 'Service not available. Please try again later.';
          } else if (response.status >= 500) {
            errorMessage = 'Server is temporarily unavailable. Please try again later.';
          }
        }
        return { success: false, message: errorMessage };
      }

      // Parse successful response
      let data: ScanSubmitResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        logger.error(LogCategory.APP, 'Failed to parse scan submission response', parseError);
        return { success: false, message: 'Invalid response from server. Please try again.' };
      }

      // Log response details
      logger.debug(LogCategory.API, 'API Response: submitScan', {
        status: response.status,
        data,
      });

      if (data.success && data.scanId) {
        logger.info(LogCategory.APP, `Scan submitted, scanId: ${data.scanId}`);
        return { success: true, scanId: data.scanId, message: data.message };
      }

      logger.warn(LogCategory.APP, 'Scan submission failed', data);
      return { success: false, message: data.message || 'Scan submission was rejected by the server.' };
    } catch (error) {
      logger.error(LogCategory.APP, 'Unexpected scan submission error', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `An unexpected error occurred: ${errorMsg}` };
    }
  }

  /**
   * Poll for report status until completed or failed
   * Returns the full report data when ready
   */
  async pollReport(
    scanId: string,
    onStatusUpdate?: (status: string) => void,
  ): Promise<{ success: boolean; data?: FullReportData; message?: string }> {
    const maxAttempts = API_CONFIG.MAX_POLL_ATTEMPTS;
    const interval = API_CONFIG.POLL_INTERVAL;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const url = `${API_CONFIG.BASE_URL}${SCAN_ENDPOINTS.REPORT}/${scanId}`;
        const requestHeaders = this.getAuthHeaders();

        // Log request details
        logger.debug(LogCategory.API, `API Request: pollReport (attempt ${attempt + 1}/${maxAttempts})`, {
          url,
          method: 'GET',
          headers: { ...requestHeaders, Authorization: requestHeaders.Authorization ? '[REDACTED]' : undefined },
          scanId,
        });

        let response: Response;
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: requestHeaders,
          });
        } catch (fetchError) {
          // Network error - retry if we have attempts left
          logger.error(LogCategory.APP, `Poll network error on attempt ${attempt + 1}`, fetchError);
          if (attempt >= maxAttempts - 1) {
            return { success: false, message: 'Unable to connect to server. Please check your connection.' };
          }
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }

        // Handle HTTP error status codes
        if (!response.ok) {
          let errorMessage = `Server error (${response.status})`;
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch {
            if (response.status === 401) {
              return { success: false, message: 'Session expired. Please log in again.' };
            } else if (response.status >= 500) {
              errorMessage = 'Server is temporarily unavailable.';
            }
          }
          
          // For server errors, retry; for client errors, fail immediately
          if (response.status >= 500 && attempt < maxAttempts - 1) {
            logger.warn(LogCategory.APP, `Poll server error on attempt ${attempt + 1}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, interval));
            continue;
          }
          
          return { success: false, message: errorMessage };
        }

        // Parse response
        let data: ReportPollResponse;
        try {
          data = await response.json();
        } catch (parseError) {
          logger.error(LogCategory.APP, `Failed to parse poll response on attempt ${attempt + 1}`, parseError);
          if (attempt >= maxAttempts - 1) {
            return { success: false, message: 'Invalid response from server.' };
          }
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }

        // Log response details
        logger.debug(LogCategory.API, `API Response: pollReport (attempt ${attempt + 1}/${maxAttempts})`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          dataStatus: data.status,
        });

        if (!data.success) {
          logger.warn(LogCategory.APP, `Poll attempt ${attempt + 1} failed`, data);
          return { success: false, message: data.message || 'Failed to fetch report.' };
        }

        onStatusUpdate?.(data.status);

        if (data.status === 'completed' && data.data) {
          logger.info(LogCategory.APP, 'Report ready');
          return { success: true, data: data.data };
        }

        if (data.status === 'failed') {
          logger.error(LogCategory.APP, 'Report processing failed');
          return { success: false, message: data.message || 'Report processing failed on server.' };
        }

        // Still processing, wait and retry
        logger.debug(LogCategory.APP, `Report processing... attempt ${attempt + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        logger.error(LogCategory.APP, `Unexpected poll error on attempt ${attempt + 1}`, error);
        // Don't fail immediately on unexpected error, retry
        if (attempt >= maxAttempts - 1) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, message: `An unexpected error occurred: ${errorMsg}` };
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    return { success: false, message: 'Report processing timed out. Please try again later.' };
  }

  /**
   * Get scan history
   */
  async getHistory(): Promise<{ success: boolean; scans?: ScanHistoryItem[]; message?: string }> {
    try {
      if (!authService.isAuthenticated()) {
        return { success: false, message: 'Not authenticated' };
      }

      const url = `${API_CONFIG.BASE_URL}${SCAN_ENDPOINTS.HISTORY}`;
      const requestHeaders = this.getAuthHeaders();

      // Log request details
      logger.debug(LogCategory.API, 'API Request: getHistory', {
        url,
        method: 'GET',
        headers: { ...requestHeaders, Authorization: requestHeaders.Authorization ? '[REDACTED]' : undefined },
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
      });

      const data: ScanHistoryResponse = await response.json();

      // Log response details
      logger.debug(LogCategory.API, 'API Response: getHistory', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        data,
      });

      if (response.ok && data.success) {
        return { success: true, scans: data.scans };
      }
      return { success: false, message: 'Failed to fetch history.' };
    } catch (error) {
      logger.error(LogCategory.APP, 'History fetch error', error);
      return { success: false, message: 'Network error.' };
    }
  }
}

export const apiService = ApiService.getInstance();
