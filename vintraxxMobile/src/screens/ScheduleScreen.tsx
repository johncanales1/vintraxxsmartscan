// ScheduleScreen for VinTraxx SmartScan
// Schedule Service Appointment form
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// Using simple text inputs instead of DateTimePicker to avoid dependency issues
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { logger, LogCategory } from '../utils/Logger';
import { apiService } from '../services/api/ApiService';
import { useAppStore } from '../store/appStore';
import { useRecentVins } from '../hooks/useRecentVins';
import { RecentVinChips } from '../components/RecentVinChips';

const PLACEHOLDER_COLOR = '#B0B8C4';

const SERVICE_TYPES = [
  'Select service type...',
  'Oil Change',
  'Tire Rotation / Alignment',
  'Brake Service',
  'Diagnostic / Check Engine',
  'Multi-Point Inspection',
  'Transmission Service',
  'AC / Heating Service',
  'General Repair',
  'Other',
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  dealership: string;
  vehicle: string;
  vin: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  additionalNotes: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  dealership?: string;
  vehicle?: string;
  vin?: string;
  serviceType?: string;
  preferredDate?: string;
  preferredTime?: string;
}

export const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation();
  const { selectedVehicle } = useAppStore();
  const { vins: recentVins, add: addRecentVin } = useRecentVins();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServiceTypePicker, setShowServiceTypePicker] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    dealership: '',
    vehicle: '',
    vin: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    additionalNotes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    logger.info(LogCategory.APP, 'ScheduleScreen: Screen opened');
  }, []);

  useEffect(() => {
    if (selectedVehicle) {
      if (selectedVehicle.vin && selectedVehicle.vin.length === 17) {
        setFormData(prev => ({
          ...prev,
          vin: prev.vin || selectedVehicle.vin,
        }));
      }
      const vehicleLabel = [
        selectedVehicle.year,
        selectedVehicle.make,
        selectedVehicle.model,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (vehicleLabel) {
        setFormData(prev => ({
          ...prev,
          vehicle: prev.vehicle || vehicleLabel,
        }));
      }
    }
  }, [selectedVehicle]);

  const handleScanVin = useCallback(() => {
    logger.info(LogCategory.APP, 'ScheduleScreen: Camera VIN scan initiated');
    (navigation as any).navigate('VinScanner', {
      onVinScanned: (vin: string) => {
        logger.info(LogCategory.APP, 'ScheduleScreen: VIN received from camera', { vin });
        updateField('vin', vin);
        // Record source=camera so the Recent VINs chips can distinguish how
        // each VIN was captured (useful for debugging OCR vs barcode).
        addRecentVin({ vin, source: 'camera' });
      },
    });
  }, [navigation, addRecentVin]);

  // Tap-to-fill from Recent VINs chip row. Saves the dealer from manually
  // typing a 17-char VIN for a vehicle they recently scanned or appraised.
  const handleSelectRecentVin = useCallback(
    (vin: string) => {
      logger.info(LogCategory.APP, 'ScheduleScreen: Recent VIN selected', { vin });
      updateField('vin', vin);
      addRecentVin({ vin, source: 'manual' });
    },
    [addRecentVin],
  );

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else {
      const digitsOnly = formData.phone.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 11) {
        newErrors.phone = 'Enter a valid US phone number (10 digits)';
      }
    }

    if (!formData.dealership.trim()) {
      newErrors.dealership = 'Dealership is required';
    }

    if (!formData.vehicle.trim()) {
      newErrors.vehicle = 'Vehicle is required';
    }

    if (!formData.vin.trim()) {
      newErrors.vin = 'VIN is required';
    }

    if (!formData.serviceType || formData.serviceType === 'Select service type...') {
      newErrors.serviceType = 'Service type is required';
    }

    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Preferred date is required';
    } else {
      const dateMatch = formData.preferredDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!dateMatch) {
        newErrors.preferredDate = 'Use MM/DD/YYYY format';
      } else {
        const [, mm, dd, yyyy] = dateMatch;
        const parsed = new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(parsed.getTime()) || parsed.getMonth() !== parseInt(mm) - 1 || parsed.getDate() !== parseInt(dd)) {
          newErrors.preferredDate = 'Enter a valid date';
        } else if (parsed < today) {
          newErrors.preferredDate = 'Date cannot be in the past';
        }
      }
    }

    if (!formData.preferredTime) {
      newErrors.preferredTime = 'Preferred time is required';
    } else {
      const timeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM|am|pm)$/;
      if (!timeRegex.test(formData.preferredTime.trim())) {
        newErrors.preferredTime = 'Use HH:MM AM/PM format (e.g. 10:30 AM)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      dealership: '',
      vehicle: '',
      vin: '',
      serviceType: '',
      preferredDate: '',
      preferredTime: '',
      additionalNotes: '',
    });
    setErrors({});
  };

  const handleGoBack = () => {
    // Navigate to Scan tab since this is a tab screen (goBack may not work)
    (navigation as any).navigate('Scan');
  };

  const handleCancel = () => {
    clearForm();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    // Start a correlation ID so every backend log entry for this submission
    // shares the same requestId as the mobile logs. Helps us diagnose
    // production "I never got a confirmation email" reports in seconds.
    await logger.withRequestId(async () => {
      logger.info(LogCategory.SCHEDULE, 'ScheduleScreen: Submitting schedule request', {
        serviceType: formData.serviceType,
        vehicle: formData.vehicle,
      });

      try {
        const result = await apiService.submitScheduleRequest({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          dealership: formData.dealership.trim(),
          vehicle: formData.vehicle.trim(),
          vin: formData.vin.trim(),
          serviceType: formData.serviceType,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          additionalNotes: formData.additionalNotes.trim() || undefined,
        });

        // Persist a successfully-submitted VIN to Recent VINs (source:manual
        // since the user typed/pasted it; camera/ocr already saved theirs).
        if (result.success && formData.vin && formData.vin.length === 17) {
          addRecentVin({ vin: formData.vin.trim().toUpperCase(), source: 'manual' });
        }

        if (result.success) {
          // 207 path — appointment saved but confirmation email failed. Make
          // this very explicit so the user doesn't retry and create a duplicate.
          if (result.warning) {
            Alert.alert(
              'Appointment Saved',
              `${result.message ?? 'Your appointment has been booked.'}\n\n${result.warning}`,
              [{ text: 'OK', onPress: clearForm }],
            );
            logger.warn(LogCategory.SCHEDULE, 'ScheduleScreen: Request saved with email-delivery warning', {
              reason: result.reason,
              appointmentId: result.appointmentId,
            });
          } else {
            Alert.alert(
              'Request Submitted',
              result.message ??
                'Your service appointment request has been submitted. You will receive a confirmation email shortly.',
              [{ text: 'OK', onPress: clearForm }],
            );
            logger.info(LogCategory.SCHEDULE, 'ScheduleScreen: Request submitted successfully', {
              appointmentId: result.appointmentId,
            });
          }
        } else if (result.emailServiceDown) {
          // 503 path — SMTP verified-down. Surface a distinct, actionable
          // dialog that tells the user the issue is on our side + offers an
          // alternative contact path instead of spamming retry.
          Alert.alert(
            'Email System Temporarily Unavailable',
            `${result.message}\n\nYour request was not submitted. Please call the service department directly, or try again in a few minutes.`,
          );
          logger.error(LogCategory.SCHEDULE, 'ScheduleScreen: Email service reported down', {
            reason: result.reason,
          });
        } else {
          Alert.alert('Submission Failed', result.message || 'Failed to submit request. Please try again.');
          logger.warn(LogCategory.SCHEDULE, 'ScheduleScreen: Request submission failed', { message: result.message });
        }
      } catch (error) {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        logger.error(LogCategory.SCHEDULE, 'ScheduleScreen: Request submission error', error);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // Using simple text inputs, no need for date/time formatting functions

  // Simple text input handlers for date and time
  const handleDateChange = (text: string) => {
    updateField('preferredDate', text);
  };

  const handleTimeChange = (text: string) => {
    updateField('preferredTime', text);
  };

  const renderInput = (
    label: string,
    field: keyof FormData,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words';
      multiline?: boolean;
      required?: boolean;
    }
  ) => {
    const { keyboardType = 'default', autoCapitalize = 'sentences', multiline = false, required = true } = options || {};
    const hasError = errors[field as keyof FormErrors];

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        <TextInput
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            hasError && styles.inputError,
          ]}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={formData[field] as string}
          onChangeText={(text) => updateField(field, text)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        {hasError && <Text style={styles.errorText}>{hasError}</Text>}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button + Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.backArrow}>{'‹'}</Text>
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Schedule Service</Text>
              <Text style={styles.headerSubtitle}>Book your appointment</Text>
            </View>
          </View>

          {/* Card wrapper for form */}
          <View style={styles.formCard}>
            {/* Section: Contact Info */}
            <Text style={styles.sectionTitle}>Contact Information</Text>

            {/* Row: Name / Email */}
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                {renderInput('Name', 'name', 'Full name')}
              </View>
              <View style={styles.halfColumn}>
                {renderInput('Email', 'email', 'email@example.com', {
                  keyboardType: 'email-address',
                  autoCapitalize: 'none',
                })}
              </View>
            </View>

            {/* Row: Phone / Dealership */}
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                {renderInput('Phone', 'phone', '(555) 000-0000', {
                  keyboardType: 'phone-pad',
                })}
              </View>
              <View style={styles.halfColumn}>
                {renderInput('Dealership', 'dealership', 'Dealership name')}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Section: Vehicle Info */}
            <Text style={styles.sectionTitle}>Vehicle Details</Text>

            {/* One-tap Recent VINs — fills the VIN field without typing. */}
            <RecentVinChips vins={recentVins} onPick={(e) => handleSelectRecentVin(e.vin)} />

            {/* Row: Vehicle / VIN */}
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                {renderInput('Vehicle', 'vehicle', 'Year Make Model')}
              </View>
              <View style={styles.halfColumn}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    VIN<Text style={styles.requiredStar}> *</Text>
                  </Text>
                  <View style={styles.vinInputRow}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.vinInput,
                        errors.vin && styles.inputError,
                      ]}
                      placeholder="VIN number"
                      placeholderTextColor={PLACEHOLDER_COLOR}
                      value={formData.vin}
                      onChangeText={(text) => updateField('vin', text.toUpperCase())}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={17}
                    />
                    <TouchableOpacity
                      style={styles.vinCameraButton}
                      onPress={handleScanVin}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.vinCameraIcon}>📷</Text>
                    </TouchableOpacity>
                  </View>
                  {errors.vin && <Text style={styles.errorText}>{errors.vin}</Text>}
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Section: Service Info */}
            <Text style={styles.sectionTitle}>Service Information</Text>

            {/* Service Type Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Service Type<Text style={styles.requiredStar}> *</Text>
              </Text>
              <TouchableOpacity
                style={[styles.input, styles.dropdown, errors.serviceType && styles.inputError]}
                onPress={() => setShowServiceTypePicker(!showServiceTypePicker)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    !formData.serviceType && styles.dropdownPlaceholder,
                  ]}
                >
                  {formData.serviceType || 'Select service type...'}
                </Text>
                <Text style={styles.dropdownArrow}>{showServiceTypePicker ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {errors.serviceType && <Text style={styles.errorText}>{errors.serviceType}</Text>}

              {showServiceTypePicker && (
                <View style={styles.pickerContainer}>
                  {SERVICE_TYPES.map((type, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pickerItem,
                        formData.serviceType === type && styles.pickerItemSelected,
                      ]}
                      onPress={() => {
                        if (index !== 0) {
                          updateField('serviceType', type);
                        }
                        setShowServiceTypePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          index === 0 && styles.pickerItemPlaceholder,
                          formData.serviceType === type && styles.pickerItemTextSelected,
                        ]}
                      >
                        {index === 0 ? '✓ ' : ''}{type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Row: Preferred Date / Preferred Time */}
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Preferred Date<Text style={styles.requiredStar}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.preferredDate && styles.inputError]}
                    placeholder="MM/DD/YYYY"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={formData.preferredDate}
                    onChangeText={handleDateChange}
                  />
                  {errors.preferredDate && <Text style={styles.errorText}>{errors.preferredDate}</Text>}
                </View>
              </View>
              <View style={styles.halfColumn}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    Preferred Time<Text style={styles.requiredStar}> *</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, errors.preferredTime && styles.inputError]}
                    placeholder="HH:MM AM/PM"
                    placeholderTextColor={PLACEHOLDER_COLOR}
                    value={formData.preferredTime}
                    onChangeText={handleTimeChange}
                  />
                  {errors.preferredTime && <Text style={styles.errorText}>{errors.preferredTime}</Text>}
                </View>
              </View>
            </View>

            {/* Using simple text inputs instead of DateTimePicker */}

            {/* Additional Notes */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Describe any concerns or additional requests..."
                placeholderTextColor={PLACEHOLDER_COLOR}
                value={formData.additionalNotes}
                onChangeText={(text) => updateField('additionalNotes', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.text.inverse} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Bottom spacing for floating tab bar */}
          <View style={styles.bottomSpacer} />
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['3xl'],
  },

  // ── Header with back button ─────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary.navy,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
    fontWeight: '400',
  },

  // ── Form card ───────────────────────────────────────────────────────
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.md,
  },

  row: {
    flexDirection: 'row',
    marginHorizontal: -spacing.xs,
  },
  halfColumn: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  requiredStar: {
    color: colors.primary.red,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    fontSize: 14,
    color: colors.text.primary,
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: 12,
  },
  inputError: {
    borderColor: colors.primary.red,
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 11,
    color: colors.primary.red,
    marginTop: 4,
    fontWeight: '500',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: PLACEHOLDER_COLOR,
  },
  dropdownArrow: {
    fontSize: 10,
    color: colors.text.muted,
    marginLeft: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: colors.primary.navy,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  pickerItemSelected: {
    backgroundColor: colors.primary.navyLight,
  },
  pickerItemText: {
    fontSize: 14,
    color: colors.text.inverse,
  },
  pickerItemPlaceholder: {
    color: 'rgba(255,255,255,0.45)',
  },
  pickerItemTextSelected: {
    fontWeight: '600',
  },
  vinInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vinInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 0,
  },
  vinCameraButton: {
    backgroundColor: colors.primary.navy,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vinCameraIcon: {
    fontSize: 18,
  },

  // ── Buttons ─────────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: spacing.lg,
  },
  button: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary.navy,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 80,
  },
});
