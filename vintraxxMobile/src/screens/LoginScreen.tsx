// LoginScreen for VinTraxx SmartScan
// Multi-step OTP email verification flow
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  ActionSheetIOS,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import jsQR from 'jsqr';
import { Buffer } from 'buffer';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { OtpInput } from '../components/OtpInput';
import { useAppStore } from '../store/appStore';
import { authService } from '../services/auth/AuthService';
import { logger, LogCategory } from '../utils/Logger';
import { GOOGLE_CONFIG } from '../config/api';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
  iosClientId: GOOGLE_CONFIG.IOS_CLIENT_ID,
  androidClientId: GOOGLE_CONFIG.ANDROID_CLIENT_ID,
  offlineAccess: false,
});

type AuthStep = 'email' | 'otp' | 'password' | 'forgot';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showServiceStatus, setShowServiceStatus] = useState(false);
  const [wantDealer, setWantDealer] = useState(false);
  const [pricePerLaborHour, setPricePerLaborHour] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const { setUser, setIsAuthenticated } = useAppStore();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate QR code image using jsQR
  const validateQrCodeImage = useCallback(async (base64Data: string, width: number, height: number): Promise<boolean> => {
    try {
      // For React Native, we need to decode the base64 image and check for QR code
      // Since jsQR requires raw image data (RGBA), we'll do a simpler validation
      // by checking if the image has enough contrast patterns typical of QR codes
      
      // Decode base64 to get raw bytes
      const rawData = Buffer.from(base64Data, 'base64');
      
      // For a proper QR validation, we'd need to decode the image to RGBA
      // Since we don't have canvas in React Native, we'll use a heuristic approach:
      // 1. Check if the image has sufficient size for a QR code (minimum ~21x21 modules)
      // 2. Check if the base64 data contains patterns suggesting high contrast (QR codes are black/white)
      
      // Minimum size check - QR codes need at least some reasonable resolution
      if (width < 50 || height < 50) {
        logger.warn(LogCategory.APP, 'QR code image too small', { width, height });
        return false;
      }
      
      // Check for minimum data size (QR codes have substantial data)
      if (rawData.length < 1000) {
        logger.warn(LogCategory.APP, 'QR code image data too small');
        return false;
      }
      
      // For now, accept images that pass basic validation
      // Full QR detection would require native module or server-side validation
      logger.info(LogCategory.APP, 'QR code image validation passed (basic check)', { width, height, dataSize: rawData.length });
      return true;
    } catch (error) {
      logger.error(LogCategory.APP, 'QR code validation error', error);
      return false;
    }
  }, []);

  // Image picker handler for logo and QR code
  const handleImagePick = useCallback((type: 'logo' | 'qrCode') => {
    const setImage = type === 'logo' ? setLogoUri : setQrCodeUri;
    const title = type === 'logo' ? 'Select Dealer Logo' : 'Select QR Code Image';

    const handleResponse = async (response: ImagePickerResponse) => {
      if (response.didCancel) {
        logger.info(LogCategory.APP, `${type} image selection cancelled`);
        return;
      }
      if (response.errorCode) {
        logger.error(LogCategory.APP, `${type} image picker error`, response.errorMessage);
        Alert.alert('Error', response.errorMessage || 'Failed to select image');
        return;
      }
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        
        // For QR code images, validate that it contains a QR code
        if (type === 'qrCode' && asset.base64) {
          const isValidQr = await validateQrCodeImage(
            asset.base64,
            asset.width || 0,
            asset.height || 0
          );
          if (!isValidQr) {
            Alert.alert(
              'Invalid QR Code',
              'The selected image does not appear to contain a valid QR code. Please select an image with a clear, readable QR code.',
              [{ text: 'OK' }]
            );
            return;
          }
        }
        
        // Convert to base64 data URI for sending to backend
        if (asset.base64) {
          const mimeType = asset.type || 'image/jpeg';
          const base64Uri = `data:${mimeType};base64,${asset.base64}`;
          setImage(base64Uri);
          logger.info(LogCategory.APP, `${type} image selected`, { size: asset.fileSize });
        } else if (asset.uri) {
          // Fallback to URI if base64 not available (shouldn't happen with includeBase64: true)
          setImage(asset.uri);
          logger.info(LogCategory.APP, `${type} image selected (URI only)`, { uri: asset.uri });
        }
      }
    };

    const options = {
      mediaType: 'photo' as const,
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8 as const,
      includeBase64: true,
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
          title,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            launchCamera(options, handleResponse);
          } else if (buttonIndex === 2) {
            launchImageLibrary(options, handleResponse);
          }
        }
      );
    } else {
      // Android - show Alert with options
      Alert.alert(
        title,
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => launchCamera(options, handleResponse) },
          { text: 'Choose from Library', onPress: () => launchImageLibrary(options, handleResponse) },
        ],
        { cancelable: true }
      );
    }
  }, [validateQrCodeImage]);

  // Google Sign-In handler
  const handleGoogleSignIn = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      
      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        if (!idToken) {
          setErrorMessage('Failed to get Google ID token.');
          return;
        }
        
        const authResponse = await authService.googleAuth(idToken);
        if (authResponse.success && authResponse.user) {
          logger.info(LogCategory.APP, 'Google sign-in successful');
          setUser(authResponse.user);
          setIsAuthenticated(true);
        } else {
          setErrorMessage(authResponse.message || 'Google sign-in failed.');
        }
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            logger.info(LogCategory.APP, 'Google sign-in cancelled');
            break;
          case statusCodes.IN_PROGRESS:
            setErrorMessage('Sign-in already in progress.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setErrorMessage('Google Play Services not available.');
            break;
          default:
            setErrorMessage('Google sign-in failed. Please try again.');
        }
      } else {
        logger.error(LogCategory.APP, 'Google sign-in error', error);
        setErrorMessage('Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [setUser, setIsAuthenticated]);

  // Forgot Password handler
  const handleForgotPassword = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.forgotPassword(email.trim());
      setSuccessMessage(result.message);
      // After showing success, user can go back to login
    } catch (error) {
      logger.error(LogCategory.APP, 'Forgot password error', error);
      setErrorMessage('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  // Step 1: Check email - for returning users, skip OTP and go directly to password
  // This matches the frontend login flow where returning users don't need OTP
  const handleEmailSubmit = useCallback(async () => {
    setErrorMessage('');
    setShowServiceStatus(false);
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      // Check if email is registered
      const checkResult = await authService.checkEmail(email.trim());
      if (!checkResult.success) {
        setErrorMessage(checkResult.message || 'Failed to check email.');
        return;
      }
      setIsRegistered(checkResult.isRegistered);

      // For returning users (already registered), skip OTP and go directly to password
      // This matches the frontend login flow
      if (checkResult.isRegistered) {
        logger.info(LogCategory.APP, 'Returning user detected, skipping OTP verification');
        animateTransition(() => {
          setStep('password');
          setPassword('');
          setConfirmPassword('');
        });
        return;
      }

      // For new users, send OTP for email verification
      const otpResult = await authService.sendOtp(email.trim());
      if (!otpResult.success) {
        setErrorMessage(otpResult.message);
        return;
      }

      setResendCooldown(60);
      animateTransition(() => {
        setStep('otp');
        setOtpCode('');
        setOtpError(false);
      });
    } catch (error) {
      logger.error(LogCategory.APP, 'Email submit error', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      setShowServiceStatus(true);
    } finally {
      setIsLoading(false);
    }
  }, [email, fadeAnim, slideAnim]);

  // Step 2: Verify OTP
  const handleOtpVerify = useCallback(async (code?: string) => {
    const otpToVerify = code || otpCode;
    setErrorMessage('');
    setOtpError(false);

    if (otpToVerify.length !== 6) {
      setErrorMessage('Please enter the 6-digit code.');
      setOtpError(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyOtp(email.trim(), otpToVerify);
      if (!result.success) {
        setErrorMessage(result.message);
        setOtpError(true);
        return;
      }

      animateTransition(() => {
        setStep('password');
        setPassword('');
        setConfirmPassword('');
      });
    } catch (error) {
      logger.error(LogCategory.APP, 'OTP verify error', error);
      setErrorMessage('Network error. Please check your connection.');
      setOtpError(true);
      setShowServiceStatus(true);
    } finally {
      setIsLoading(false);
    }
  }, [otpCode, email, fadeAnim, slideAnim]);

  // Step 3: Register or Login with password
  const handlePasswordSubmit = useCallback(async () => {
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }

    if (!isRegistered && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    // Validate dealer price if dealer mode is selected
    const dealerPrice = wantDealer && pricePerLaborHour.trim()
      ? parseFloat(pricePerLaborHour.trim())
      : undefined;
    if (wantDealer && (!dealerPrice || isNaN(dealerPrice) || dealerPrice <= 0)) {
      setErrorMessage('Please enter a valid price per labor hour.');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (isRegistered) {
        response = await authService.login(email.trim(), password, wantDealer || undefined, dealerPrice);
      } else {
        // Pass logo and QR code images for new dealer registration
        response = await authService.register(
          email.trim(),
          password,
          wantDealer || undefined,
          dealerPrice,
          wantDealer && logoUri ? logoUri : undefined,
          wantDealer && qrCodeUri ? qrCodeUri : undefined
        );
      }

      if (response.success && response.user) {
        logger.info(LogCategory.APP, `${isRegistered ? 'Login' : 'Registration'} successful, isDealer: ${response.user.isDealer}`);
        // Update Zustand store - RootNavigator will reactively show the correct screen
        setUser(response.user);
        setIsAuthenticated(true);
        // Navigation is handled automatically by conditional rendering in RootNavigator
      } else {
        setErrorMessage(response.message || 'Authentication failed.');
      }
    } catch (error) {
      logger.error(LogCategory.APP, 'Password submit error', error);
      setErrorMessage('Network error. Please check your connection.');
      setShowServiceStatus(true);
    } finally {
      setIsLoading(false);
    }
  }, [password, confirmPassword, isRegistered, email, navigation, setUser, setIsAuthenticated, wantDealer, pricePerLaborHour, logoUri, qrCodeUri]);

  // Resend OTP
  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await authService.sendOtp(email.trim());
      if (result.success) {
        setResendCooldown(60);
        setOtpCode('');
        setOtpError(false);
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('Failed to resend code.');
    } finally {
      setIsLoading(false);
    }
  }, [email, resendCooldown]);

  // Go back to previous step
  const handleBack = () => {
    setErrorMessage('');
    setSuccessMessage('');
    animateTransition(() => {
      if (step === 'otp') {
        setStep('email');
        setOtpCode('');
        setOtpError(false);
      } else if (step === 'password') {
        // For returning users (who skipped OTP), go back to email
        // For new users (who went through OTP), go back to OTP
        if (isRegistered) {
          setStep('email');
        } else {
          setStep('otp');
        }
        setPassword('');
        setConfirmPassword('');
      } else if (step === 'forgot') {
        setStep('email');
      }
    });
  };

  // Step indicator - returns step number (for returning users, step 2 is skipped)
  const getStepNumber = (): number => {
    switch (step) {
      case 'email': return 1;
      case 'otp': return 2;
      case 'password': return isRegistered ? 2 : 3; // Returning users: 2 steps, New users: 3 steps
      default: return 1;
    }
  };

  // Total steps: 2 for returning users (email → password), 3 for new users (email → OTP → password)
  const getTotalSteps = (): number => isRegistered ? 2 : 3;

  const renderStepIndicator = () => {
    const totalSteps = getTotalSteps();
    const currentStep = getStepNumber();
    
    return (
      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((num) => (
          <View key={num} style={styles.stepRow}>
            <View
              style={[
                styles.stepDot,
                num <= currentStep && styles.stepDotActive,
                num < currentStep && styles.stepDotCompleted,
              ]}
            >
              {num < currentStep ? (
                <Text style={styles.stepDotCheckmark}>✓</Text>
              ) : (
                <Text style={[styles.stepDotText, num <= currentStep && styles.stepDotTextActive]}>
                  {num}
                </Text>
              )}
            </View>
            {num < totalSteps && (
              <View style={[styles.stepLine, num < currentStep && styles.stepLineActive]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>VinTraxx SmartScan</Text>
            <Text style={styles.subtitle}>Professional OBD-II Diagnostics</Text>
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Form Card */}
          <Animated.View
            style={[
              styles.formSection,
              { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
            ]}
          >
            {/* Back button for steps 2+ */}
            {step !== 'email' && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton} disabled={isLoading}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
            )}

            {/* Step 1: Email */}
            {step === 'email' && (
              <>
                <Text style={styles.formTitle}>Get Started</Text>
                <Text style={styles.formSubtitle}>
                  Enter your email to sign in or create an account
                </Text>

                {/* Google Sign-In Button */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading || isLoading}
                >
                  <View style={styles.googleButtonContent}>
                    <Image
                      source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                      style={styles.googleIcon}
                    />
                    <Text style={styles.googleButtonText}>
                      {googleLoading ? 'Signing in...' : 'Continue with Google'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.text.light}
                    value={email}
                    onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading && !googleLoading}
                    returnKeyType="next"
                    onSubmitEditing={handleEmailSubmit}
                  />
                </View>
                <Button
                  title="Continue"
                  onPress={handleEmailSubmit}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || googleLoading}
                  style={styles.submitButton}
                />
              </>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <>
                <Text style={styles.formTitle}>Verify Your Email</Text>
                <Text style={styles.formSubtitle}>
                  Enter the 6-digit code sent to
                </Text>
                <Text style={styles.emailHighlight}>{email}</Text>

                <View style={styles.otpContainer}>
                  <OtpInput
                    value={otpCode}
                    onChange={(code) => { setOtpCode(code); setOtpError(false); setErrorMessage(''); }}
                    onComplete={handleOtpVerify}
                    disabled={isLoading}
                    error={otpError}
                  />
                </View>

                <Button
                  title="Verify Code"
                  onPress={() => handleOtpVerify()}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || otpCode.length !== 6}
                  style={styles.submitButton}
                />

                <View style={styles.resendSection}>
                  <Text style={styles.resendText}>Didn't receive the code?</Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendCooldown > 0 || isLoading}
                  >
                    <Text style={[
                      styles.resendLink,
                      (resendCooldown > 0 || isLoading) && styles.resendLinkDisabled,
                    ]}>
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Step 3: Password */}
            {step === 'password' && (
              <>
                <Text style={styles.formTitle}>
                  {isRegistered ? 'Welcome Back' : 'Create Password'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isRegistered
                    ? 'Enter your password to sign in'
                    : 'Set a secure password for your account'}
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={isRegistered ? 'Enter your password' : 'Create a password'}
                    placeholderTextColor={colors.text.light}
                    value={password}
                    onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!isLoading}
                    returnKeyType={isRegistered ? 'done' : 'next'}
                    onSubmitEditing={isRegistered ? handlePasswordSubmit : undefined}
                  />
                </View>

                {!isRegistered && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.text.light}
                      value={confirmPassword}
                      onChangeText={(text) => { setConfirmPassword(text); setErrorMessage(''); }}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handlePasswordSubmit}
                    />
                  </View>
                )}

                {!isRegistered && (
                  <Text style={styles.passwordHint}>
                    Minimum 8 characters
                  </Text>
                )}

                {/* Dealer price per labor hour input - shown when dealer mode is active */}
                {wantDealer && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price Per Labor Hour ($)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 195"
                      placeholderTextColor={colors.text.light}
                      value={pricePerLaborHour}
                      onChangeText={(text) => { setPricePerLaborHour(text.replace(/[^0-9.]/g, '')); setErrorMessage(''); }}
                      keyboardType="decimal-pad"
                      editable={!isLoading}
                      returnKeyType="done"
                    />
                  </View>
                )}

                {/* Dealer logo upload - shown when dealer mode is active and registering */}
                {wantDealer && !isRegistered && (
                  <View style={styles.imageUploadContainer}>
                    <Text style={styles.inputLabel}>Dealer Logo (Optional)</Text>
                    <View style={styles.imageUploadRow}>
                      {logoUri ? (
                        <Image source={{ uri: logoUri }} style={styles.imagePreview} />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.imagePlaceholderText}>No Logo</Text>
                        </View>
                      )}
                      <View style={styles.imageUploadActions}>
                        <TouchableOpacity
                          style={styles.imageUploadButton}
                          onPress={() => handleImagePick('logo')}
                          disabled={isLoading}
                        >
                          <Text style={styles.imageUploadButtonText}>
                            {logoUri ? 'Change Logo' : 'Upload Logo'}
                          </Text>
                        </TouchableOpacity>
                        {logoUri && (
                          <TouchableOpacity
                            style={styles.imageRemoveButton}
                            onPress={() => setLogoUri(null)}
                            disabled={isLoading}
                          >
                            <Text style={styles.imageRemoveButtonText}>Remove</Text>
                          </TouchableOpacity>
                        )}
                        <Text style={styles.imageHint}>PNG, JPG up to 5MB</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Dealer QR code upload - shown when dealer mode is active and registering */}
                {wantDealer && !isRegistered && (
                  <View style={styles.imageUploadContainer}>
                    <Text style={styles.inputLabel}>QR Code Image (Optional)</Text>
                    <View style={styles.imageUploadRow}>
                      {qrCodeUri ? (
                        <Image source={{ uri: qrCodeUri }} style={styles.imagePreview} />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.imagePlaceholderText}>No QR</Text>
                        </View>
                      )}
                      <View style={styles.imageUploadActions}>
                        <TouchableOpacity
                          style={styles.imageUploadButton}
                          onPress={() => handleImagePick('qrCode')}
                          disabled={isLoading}
                        >
                          <Text style={styles.imageUploadButtonText}>
                            {qrCodeUri ? 'Change QR Code' : 'Upload QR Code'}
                          </Text>
                        </TouchableOpacity>
                        {qrCodeUri && (
                          <TouchableOpacity
                            style={styles.imageRemoveButton}
                            onPress={() => setQrCodeUri(null)}
                            disabled={isLoading}
                          >
                            <Text style={styles.imageRemoveButtonText}>Remove</Text>
                          </TouchableOpacity>
                        )}
                        <Text style={styles.imageHint}>PNG, JPG up to 5MB</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Dealer toggle link */}
                <TouchableOpacity
                  onPress={() => setWantDealer(!wantDealer)}
                  style={styles.dealerLinkContainer}
                  disabled={isLoading}
                >
                  <Text style={styles.dealerLinkText}>
                    {wantDealer ? 'Sign in as Regular User' : 'Do you want to sign in as Dealer?'}
                  </Text>
                </TouchableOpacity>

                <Button
                  title={isRegistered ? 'Sign In' : 'Create Account'}
                  onPress={handlePasswordSubmit}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.submitButton}
                />

                {/* Forgot Password link - only for returning users */}
                {isRegistered && (
                  <TouchableOpacity
                    onPress={() => {
                      setErrorMessage('');
                      setSuccessMessage('');
                      animateTransition(() => setStep('forgot'));
                    }}
                    style={styles.forgotPasswordLink}
                    disabled={isLoading}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Forgot Password Step */}
            {step === 'forgot' && (
              <>
                <Text style={styles.formTitle}>Reset Password</Text>
                <Text style={styles.formSubtitle}>
                  Enter your email to receive a password reset link
                </Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.text.light}
                    value={email}
                    onChangeText={(text) => { setEmail(text); setErrorMessage(''); setSuccessMessage(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleForgotPassword}
                  />
                </View>
                <Button
                  title="Send Reset Link"
                  onPress={handleForgotPassword}
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.submitButton}
                />
                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.forgotPasswordLink}
                  disabled={isLoading}
                >
                  <Text style={styles.forgotPasswordText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Success Message */}
            {successMessage !== '' && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            )}

            {/* Error Message */}
            {errorMessage !== '' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {showServiceStatus && (
              <View style={styles.serviceStatusContainer}>
                <Text style={styles.serviceStatusText}>
                  Service is currently updating. Please wait a moment and try again.
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              VinTraxx SmartScan connects to your OBD-II scanner to provide comprehensive vehicle diagnostics and health reports
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['3xl'],
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.styles.h2,
    color: colors.primary.navy,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    borderColor: colors.primary.navy,
    backgroundColor: colors.primary.navy,
  },
  stepDotCompleted: {
    backgroundColor: colors.status.success,
    borderColor: colors.status.success,
  },
  stepDotText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.muted,
  },
  stepDotTextActive: {
    color: colors.text.inverse,
  },
  stepDotCheckmark: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border.medium,
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.status.success,
  },
  // Form card
  formSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  backButton: {
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.medium,
  },
  formTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emailHighlight: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
  },
  submitButton: {
    marginTop: spacing.sm,
    borderRadius: 10,
  },
  // OTP specific
  otpContainer: {
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  resendText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  resendLink: {
    ...typography.styles.bodySmall,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
  },
  resendLinkDisabled: {
    color: colors.text.muted,
  },
  // Dealer link
  dealerLinkContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  dealerLinkText: {
    ...typography.styles.bodySmall,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
    textDecorationLine: 'underline' as const,
  },
  // Google Sign-In
  googleButton: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 10,
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    paddingHorizontal: spacing.md,
    fontSize: 13,
    color: colors.text.muted,
    fontWeight: typography.fontWeight.medium,
  },
  // Forgot Password
  forgotPasswordLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  forgotPasswordText: {
    ...typography.styles.bodySmall,
    color: colors.primary.navy,
    textDecorationLine: 'underline' as const,
  },
  // Success message
  successContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.status.successLight,
    borderRadius: spacing.inputRadius,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.success,
  },
  successText: {
    ...typography.styles.bodySmall,
    color: colors.status.success,
  },
  // Password hints
  passwordHint: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  // Error
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.status.errorLight,
    borderRadius: spacing.inputRadius,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.error,
  },
  errorText: {
    ...typography.styles.bodySmall,
    color: colors.status.error,
  },
  serviceStatusContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.status.warningLight,
    borderRadius: spacing.inputRadius,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.warning,
  },
  serviceStatusText: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  // Footer
  infoSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: 'auto',
  },
  infoText: {
    ...typography.styles.caption,
    color: colors.text.muted,
    textAlign: 'center',
  },
  // Image upload styles for dealer logo and QR code
  imageUploadContainer: {
    marginBottom: spacing.md,
  },
  imageUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 10,
    color: colors.text.muted,
    textAlign: 'center',
  },
  imageUploadActions: {
    flex: 1,
    gap: spacing.xs,
  },
  imageUploadButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary.navy,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  imageUploadButtonText: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.inverse,
  },
  imageRemoveButton: {
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  imageRemoveButtonText: {
    fontSize: 12,
    color: colors.status.error,
    textDecorationLine: 'underline',
  },
  imageHint: {
    fontSize: 11,
    color: colors.text.muted,
  },
});
