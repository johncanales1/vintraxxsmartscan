// StatCard component for VinTraxx SmartScan
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

type StatCardVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string | React.ReactNode;
  variant?: StatCardVariant;
  large?: boolean;
  style?: ViewStyle;
}

const getVariantColors = (variant: StatCardVariant) => {
  switch (variant) {
    case 'primary':
      return {
        background: colors.primary.navy,
        text: colors.text.inverse,
        accent: colors.primary.red,
      };
    case 'success':
      return {
        background: colors.status.successLight,
        text: colors.status.success,
        accent: colors.status.success,
      };
    case 'warning':
      return {
        background: colors.status.warningLight,
        text: colors.status.warning,
        accent: colors.status.warning,
      };
    case 'error':
      return {
        background: colors.status.errorLight,
        text: colors.status.error,
        accent: colors.status.error,
      };
    case 'info':
      return {
        background: colors.status.infoLight,
        text: colors.status.info,
        accent: colors.status.info,
      };
    default:
      return {
        background: colors.background.secondary,
        text: colors.text.primary,
        accent: colors.primary.navy,
      };
  }
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  large = false,
  style,
}) => {
  const variantColors = getVariantColors(variant);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: variantColors.background },
        large && styles.containerLarge,
        style,
      ]}
    >
      {icon && (
        typeof icon === 'string' 
          ? <Text style={[styles.icon, large && styles.iconLarge]}>{icon}</Text>
          : <View style={[styles.iconContainer, large && styles.iconContainerLarge]}>{icon}</View>
      )}
      
      <Text
        style={[
          styles.title,
          { color: variant === 'primary' ? 'rgba(255,255,255,0.8)' : colors.text.secondary },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      
      <Text
        style={[
          styles.value,
          large && styles.valueLarge,
          { color: variantColors.text },
        ]}
        numberOfLines={1}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            { color: variant === 'primary' ? 'rgba(255,255,255,0.7)' : colors.text.muted },
          ]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 100,
  },
  containerLarge: {
    padding: spacing.lg,
    minWidth: 140,
  },
  icon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  iconLarge: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    marginBottom: spacing.xs,
  },
  iconContainerLarge: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.styles.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  value: {
    ...typography.styles.h3,
    marginBottom: 2,
  },
  valueLarge: {
    ...typography.styles.h2,
  },
  subtitle: {
    ...typography.styles.caption,
    marginTop: spacing.xs,
  },
});
