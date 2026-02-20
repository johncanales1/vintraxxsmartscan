// OTP Input component for VinTraxx SmartScan
// 6-digit code input with individual boxes
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Keyboard,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}) => {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Shake animation on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const digits = value.split('').concat(Array(length - value.length).fill(''));

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (digits[index]) {
        // Clear current digit
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      } else if (index > 0) {
        // Move to previous and clear
        const newValue = value.slice(0, index - 1) + value.slice(index);
        onChange(newValue);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleChange = (index: number, text: string) => {
    // Only allow numeric input
    const digit = text.replace(/[^0-9]/g, '');
    if (!digit) return;

    // Handle paste of full code
    if (digit.length > 1) {
      const pastedCode = digit.slice(0, length);
      onChange(pastedCode);
      if (pastedCode.length === length) {
        Keyboard.dismiss();
        onComplete?.(pastedCode);
      } else {
        inputRefs.current[pastedCode.length]?.focus();
      }
      return;
    }

    // Single digit input
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('').slice(0, length);
    onChange(newValue);

    // Auto-advance to next input
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newValue.length === length) {
      Keyboard.dismiss();
      onComplete?.(newValue);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(-1);
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnim }] }]}>
      {digits.map((digit, index) => (
        <View
          key={index}
          style={[
            styles.box,
            focusedIndex === index && styles.boxFocused,
            error && styles.boxError,
            digit !== '' && styles.boxFilled,
          ]}
        >
          <TextInput
            ref={(ref) => { inputRefs.current[index] = ref; }}
            style={[
              styles.input,
              error && styles.inputError,
            ]}
            value={digit}
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
            onFocus={() => handleFocus(index)}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={index === 0 ? length : 1}
            editable={!disabled}
            selectTextOnFocus
            caretHidden
          />
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: spacing.inputRadius,
    borderWidth: 2,
    borderColor: colors.border.medium,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxFocused: {
    borderColor: colors.primary.navy,
    backgroundColor: colors.background.secondary,
    shadowColor: colors.primary.navy,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  boxFilled: {
    borderColor: colors.primary.navy,
    backgroundColor: colors.primary.navy + '08',
  },
  boxError: {
    borderColor: colors.status.error,
    backgroundColor: colors.status.errorLight,
  },
  input: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.navy,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  inputError: {
    color: colors.status.error,
  },
});
