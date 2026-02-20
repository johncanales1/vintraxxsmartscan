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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { OtpInput } from '../components/OtpInput';
import { useAppStore } from '../store/appStore';
import { authService } from '../services/auth/AuthService';
import { logger, LogCategory } from '../utils/Logger';

type AuthStep = 'email' | 'otp' | 'password';

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
  const [apiDebugText, setApiDebugText] = useState('');
  const [showApiDebug, setShowApiDebug] = useState(false);

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

  // Step 1: Check email and send OTP
  const handleEmailSubmit = useCallback(async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      setShowApiDebug(true);
      setApiDebugText('No API request sent: email is empty.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      setShowApiDebug(true);
      setApiDebugText('No API request sent: email format is invalid.');
      return;
    }

    authService.startApiTrace();
    setShowApiDebug(true);
    setApiDebugText('');

    setIsLoading(true);
    try {
      // Check if email is registered
      const checkResult = await authService.checkEmail(email.trim());
      if (!checkResult.success) {
        setErrorMessage(checkResult.message || 'Failed to check email.');
        return;
      }
      setIsRegistered(checkResult.isRegistered);

      // Send OTP
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
    } finally {
      setApiDebugText(authService.exportApiTrace());
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

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isRegistered && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (isRegistered) {
        response = await authService.login(email.trim(), password);
      } else {
        response = await authService.register(email.trim(), password);
      }

      if (response.success && response.user) {
        logger.info(LogCategory.APP, `${isRegistered ? 'Login' : 'Registration'} successful`);
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
    } finally {
      setIsLoading(false);
    }
  }, [password, confirmPassword, isRegistered, email, navigation, setUser, setIsAuthenticated]);

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
    animateTransition(() => {
      if (step === 'otp') {
        setStep('email');
        setOtpCode('');
        setOtpError(false);
      } else if (step === 'password') {
        setStep('otp');
        setPassword('');
        setConfirmPassword('');
      }
    });
  };

  // Step indicator
  const getStepNumber = (): number => {
    switch (step) {
      case 'email': return 1;
      case 'otp': return 2;
      case 'password': return 3;
      default: return 1;
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((num) => (
        <View key={num} style={styles.stepRow}>
          <View
            style={[
              styles.stepDot,
              num <= getStepNumber() && styles.stepDotActive,
              num < getStepNumber() && styles.stepDotCompleted,
            ]}
          >
            {num < getStepNumber() ? (
              <Text style={styles.stepDotCheckmark}>✓</Text>
            ) : (
              <Text style={[styles.stepDotText, num <= getStepNumber() && styles.stepDotTextActive]}>
                {num}
              </Text>
            )}
          </View>
          {num < 3 && (
            <View style={[styles.stepLine, num < getStepNumber() && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

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
                    editable={!isLoading}
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
                  disabled={isLoading}
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
                    Minimum 6 characters
                  </Text>
                )}

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
              </>
            )}

            {/* Error Message */}
            {errorMessage !== '' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {showApiDebug && (
              <View style={styles.apiDebugContainer}>
                <View style={styles.apiDebugHeader}>
                  <Text style={styles.apiDebugTitle}>API Debug</Text>
                  <TouchableOpacity
                    onPress={() => setShowApiDebug(false)}
                    disabled={isLoading}
                  >
                    <Text style={styles.apiDebugHide}>Hide</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.apiDebugScroll} nestedScrollEnabled>
                  <Text style={styles.apiDebugText}>{apiDebugText || 'No API trace yet.'}</Text>
                </ScrollView>
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
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
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
  apiDebugContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: spacing.inputRadius,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  apiDebugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  apiDebugTitle: {
    ...typography.styles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  apiDebugHide: {
    ...typography.styles.bodySmall,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
  },
  apiDebugScroll: {
    maxHeight: 220,
  },
  apiDebugText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
});
