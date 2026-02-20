// Button component for VinTraxx SmartScan
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string | React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const getVariantStyles = (variant: ButtonVariant, disabled: boolean) => {
  const baseOpacity = disabled ? 0.5 : 1;
  
  switch (variant) {
    case 'primary':
      return {
        container: {
          backgroundColor: colors.primary.red,
          borderWidth: 0,
          opacity: baseOpacity,
        },
        text: {
          color: colors.text.inverse,
        },
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: colors.primary.navy,
          borderWidth: 0,
          opacity: baseOpacity,
        },
        text: {
          color: colors.text.inverse,
        },
      };
    case 'outline':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary.navy,
          opacity: baseOpacity,
        },
        text: {
          color: colors.primary.navy,
        },
      };
    case 'ghost':
      return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 0,
          opacity: baseOpacity,
        },
        text: {
          color: colors.primary.navy,
        },
      };
    case 'danger':
      return {
        container: {
          backgroundColor: colors.status.error,
          borderWidth: 0,
          opacity: baseOpacity,
        },
        text: {
          color: colors.text.inverse,
        },
      };
    default:
      return {
        container: {
          backgroundColor: colors.primary.red,
          borderWidth: 0,
          opacity: baseOpacity,
        },
        text: {
          color: colors.text.inverse,
        },
      };
  }
};

const getSizeStyles = (size: ButtonSize) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        fontSize: typography.fontSize.sm,
        iconSize: 14,
      };
    case 'large':
      return {
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        fontSize: typography.fontSize.lg,
        iconSize: 24,
      };
    default:
      return {
        paddingVertical: spacing.buttonPadding,
        paddingHorizontal: spacing.lg,
        fontSize: typography.fontSize.md,
        iconSize: 18,
      };
  }
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const variantStyles = getVariantStyles(variant, disabled || loading);
  const sizeStyles = getSizeStyles(size);

  const renderIcon = () => {
    if (!icon) return null;
    
    // If icon is a string (emoji), render as Text
    if (typeof icon === 'string') {
      return (
        <Text style={[styles.icon, iconPosition === 'right' && styles.iconRight, { fontSize: sizeStyles.iconSize }]}>
          {icon}
        </Text>
      );
    }
    
    // If icon is a React element (SVG), render directly
    return (
      <View style={[styles.iconWrapper, iconPosition === 'right' && styles.iconWrapperRight]}>
        {icon}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          ...variantStyles.container,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.text.color}
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <View style={styles.contentContainer}>
          {icon && iconPosition === 'left' && renderIcon()}
          <Text
            style={[
              styles.text,
              { fontSize: sizeStyles.fontSize },
              variantStyles.text,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && renderIcon()}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.buttonRadius,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWidth: {
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: typography.fontWeight.semiBold,
  },
  icon: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  iconWrapperRight: {
    marginRight: 0,
    marginLeft: spacing.sm,
  },
});
