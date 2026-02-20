// StatusBadge component for VinTraxx SmartScan
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

// Import SVG icons
import CheckIcon from '../assets/icons/check.svg';
import RefreshIcon from '../assets/icons/refresh.svg';
import CloseIcon from '../assets/icons/close.svg';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: string | React.ReactNode;
  style?: ViewStyle;
}

const getVariantColors = (variant: BadgeVariant) => {
  switch (variant) {
    case 'success':
      return {
        background: colors.status.successLight,
        text: colors.status.success,
      };
    case 'warning':
      return {
        background: colors.status.warningLight,
        text: colors.status.warning,
      };
    case 'error':
      return {
        background: colors.status.errorLight,
        text: colors.status.error,
      };
    case 'info':
      return {
        background: colors.status.infoLight,
        text: colors.status.info,
      };
    default:
      return {
        background: colors.background.primary,
        text: colors.text.secondary,
      };
  }
};

const getSizeStyles = (size: BadgeSize) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: 2,
        paddingHorizontal: spacing.sm,
        fontSize: 10,
        iconSize: 10,
      };
    case 'large':
      return {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.base,
        fontSize: 14,
        iconSize: 16,
      };
    default:
      return {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        fontSize: 12,
        iconSize: 12,
      };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'medium',
  icon,
  style,
}) => {
  const variantColors = getVariantColors(variant);
  const sizeStyles = getSizeStyles(size);

  const renderIcon = () => {
    if (!icon) return null;
    
    // If icon is a string (emoji), render as Text
    if (typeof icon === 'string') {
      return (
        <Text style={[styles.icon, { fontSize: sizeStyles.iconSize }]}>
          {icon}
        </Text>
      );
    }
    
    // If icon is a React element (SVG), render directly
    return (
      <View style={styles.iconWrapper}>
        {icon}
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variantColors.background,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      {renderIcon()}
      <Text
        style={[
          styles.label,
          {
            color: variantColors.text,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// Connection status specific badge
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  style?: ViewStyle;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status, style }) => {
  const getConfig = () => {
    switch (status) {
      case 'disconnected':
        return {
          label: 'Disconnected',
          variant: 'error' as BadgeVariant,
          icon: <CloseIcon width={14} height={14} color={colors.status.error} />,
        };
      case 'connecting':
        return {
          label: 'Connecting...',
          variant: 'warning' as BadgeVariant,
          icon: <RefreshIcon width={14} height={14} color={colors.status.warning} />,
        };
      case 'connected':
        return {
          label: 'Connected',
          variant: 'success' as BadgeVariant,
          icon: <CheckIcon width={14} height={14} color={colors.status.success} />,
        };
    }
  };

  const { label, variant, icon } = getConfig();

  return (
    <StatusBadge
      label={label}
      variant={variant}
      icon={icon}
      size="medium"
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing.xs,
  },
  iconWrapper: {
    marginRight: spacing.xs,
  },
  label: {
    fontWeight: typography.fontWeight.semiBold,
  },
});
