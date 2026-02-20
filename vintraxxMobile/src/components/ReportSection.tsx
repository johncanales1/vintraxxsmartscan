// ReportSection component for VinTraxx SmartScan
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

type SectionVariant = 'default' | 'success' | 'warning' | 'error';

interface ReportSectionProps {
  title: string;
  subtitle?: string;
  icon?: string | React.ReactNode;
  variant?: SectionVariant;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

const getVariantColors = (variant: SectionVariant) => {
  switch (variant) {
    case 'success':
      return {
        headerBg: colors.status.successLight,
        headerText: colors.status.success,
        iconBg: colors.status.success,
      };
    case 'warning':
      return {
        headerBg: colors.status.warningLight,
        headerText: colors.status.warning,
        iconBg: colors.status.warning,
      };
    case 'error':
      return {
        headerBg: colors.status.errorLight,
        headerText: colors.status.error,
        iconBg: colors.status.error,
      };
    default:
      return {
        headerBg: colors.background.primary,
        headerText: colors.text.primary,
        iconBg: colors.primary.navy,
      };
  }
};

export const ReportSection: React.FC<ReportSectionProps> = ({
  title,
  subtitle,
  icon,
  variant = 'default',
  headerRight,
  children,
  style,
  contentStyle,
}) => {
  const variantColors = getVariantColors(variant);

  const renderIcon = () => {
    if (!icon) return null;
    
    // If icon is a string (emoji), render as Text
    if (typeof icon === 'string') {
      return (
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: variantColors.headerText }]}>{icon}</Text>
        </View>
      );
    }
    
    // If icon is a React element (SVG), render directly without circle background
    return (
      <View style={styles.iconContainer}>
        {icon}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Section Header */}
      <View style={[styles.header, { backgroundColor: variantColors.headerBg }]}>
        <View style={styles.headerLeft}>
          {renderIcon()}
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: variantColors.headerText }]}>
              {title}
            </Text>
            {subtitle && (
              <Text style={styles.subtitle}>{subtitle}</Text>
            )}
          </View>
        </View>
        {headerRight && (
          <View style={styles.headerRight}>{headerRight}</View>
        )}
      </View>

      {/* Section Content */}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
};

// Simple Section without header styling
export const SimpleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}> = ({ title, children, style }) => (
  <View style={[styles.simpleContainer, style]}>
    <Text style={styles.simpleTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardRadius,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 18,
    color: colors.text.inverse,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...typography.styles.h4,
  },
  subtitle: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  headerRight: {
    marginLeft: spacing.md,
  },
  content: {
    padding: spacing.cardPadding,
  },
  simpleContainer: {
    marginBottom: spacing.lg,
  },
  simpleTitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
});
