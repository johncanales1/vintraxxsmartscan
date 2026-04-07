// ScheduleScreen for VinTraxx SmartScan
// Schedule Service Appointment form
import React, { useState, useEffect } from 'react';
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
    }

    if (!formData.preferredTime) {
      newErrors.preferredTime = 'Preferred time is required';
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
      preferredDate: null,
      preferredTime: null,
      additionalNotes: '',
    });
    setErrors({});
  };

  const handleGoBack = () => {
    navigation.goBack();
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
    logger.info(LogCategory.APP, 'ScheduleScreen: Submitting schedule request', {
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
        preferredDate: formData.preferredDate!.toISOString(),
        preferredTime: formData.preferredTime!.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        additionalNotes: formData.additionalNotes.trim() || undefined,
      });

      if (result.success) {
        Alert.alert(
          'Request Submitted',
          'Your service appointment request has been submitted. You will receive a confirmation email shortly.',
          [{ text: 'OK', onPress: clearForm }]
        );
        logger.info(LogCategory.APP, 'ScheduleScreen: Request submitted successfully');
      } else {
        Alert.alert('Submission Failed', result.message || 'Failed to submit request. Please try again.');
        logger.warn(LogCategory.APP, 'ScheduleScreen: Request submission failed', { message: result.message });
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      logger.error(LogCategory.APP, 'ScheduleScreen: Request submission error', error);
    } finally {
      setIsSubmitting(false);
    }
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
          placeholderTextColor={colors.primary.red + '80'}
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Schedule Service Appointment</Text>
          </View>

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

          {/* Row: Vehicle / VIN */}
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              {renderInput('Vehicle', 'vehicle', 'Year Make Model')}
            </View>
            <View style={styles.halfColumn}>
              {renderInput('VIN', 'vin', 'VIN number', {
                autoCapitalize: 'none',
              })}
            </View>
          </View>

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
              <Text style={styles.dropdownArrow}>▼</Text>
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
                  placeholderTextColor={colors.primary.red + '80'}
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
                  placeholderTextColor={colors.primary.red + '80'}
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
              placeholderTextColor={colors.primary.red + '80'}
              value={formData.additionalNotes}
              onChangeText={(text) => updateField('additionalNotes', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.goBackButton]}
              onPress={handleGoBack}
            >
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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

          {/* Bottom spacing for tab bar */}
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
  header: {
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.styles.h2,
    color: colors.primary.navy,
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
    ...typography.styles.caption,
    color: colors.primary.navy,
    marginBottom: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  requiredStar: {
    color: colors.primary.red,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.inputRadius,
    paddingHorizontal: spacing.inputPadding,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: spacing.md,
  },
  inputError: {
    borderColor: colors.primary.red,
  },
  errorText: {
    ...typography.styles.caption,
    color: colors.primary.red,
    marginTop: spacing.xs,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.text.muted,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: spacing.sm,
  },
  pickerContainer: {
    backgroundColor: colors.primary.navy,
    borderRadius: spacing.cardRadius,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary.navyLight + '30',
  },
  pickerItemSelected: {
    backgroundColor: colors.primary.navyLight,
  },
  pickerItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
  },
  pickerItemPlaceholder: {
    color: colors.text.light,
  },
  pickerItemTextSelected: {
    fontWeight: typography.fontWeight.semiBold,
  },
  dateTimeInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  dateTimePlaceholder: {
    color: colors.text.muted,
  },
  dateTimeIcon: {
    fontSize: 18,
    marginLeft: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.buttonRadius,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBackButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  goBackButtonText: {
    ...typography.styles.button,
    color: colors.text.secondary,
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  cancelButtonText: {
    ...typography.styles.button,
    color: colors.text.secondary,
  },
  submitButton: {
    backgroundColor: colors.primary.navy,
  },
  submitButtonText: {
    ...typography.styles.button,
    color: colors.text.inverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 100,
  },
});
