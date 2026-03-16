// CodeTable component for VinTraxx SmartScan
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { DtcCode, DtcStatus, DtcSeverity, getDtcStatusLabel } from '../models/DtcCode';
import CheckIcon from '../assets/icons/check.svg';

interface CodeTableProps {
  codes: DtcCode[];
  onCodePress?: (code: DtcCode) => void;
  showStatus?: boolean;
  showCost?: boolean;
  emptyMessage?: string;
}

const getStatusColor = (status: DtcStatus) => {
  switch (status) {
    case 'active':
      return colors.status.error;
    case 'pending':
      return colors.status.warning;
    case 'cleared':
      return colors.status.success;
    case 'history':
      return colors.text.muted;
    default:
      return colors.text.secondary;
  }
};

const getSeverityIcon = (severity: DtcSeverity) => {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'warning':
      return '🟡';
    case 'info':
      return '🔵';
    default:
      return '⚪';
  }
};

export const CodeTable: React.FC<CodeTableProps> = ({
  codes,
  onCodePress,
  showStatus = true,
  showCost = true,
  emptyMessage = 'No codes found',
}) => {
  if (codes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <CheckIcon width={32} height={32} color={colors.status.success} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Code Cards */}
      {codes.map((code, index) => (
        <TouchableOpacity
          key={code.id}
          style={[
            styles.codeCard,
            index === codes.length - 1 && styles.codeCardLast,
          ]}
          onPress={() => onCodePress?.(code)}
          activeOpacity={onCodePress ? 0.7 : 1}
          disabled={!onCodePress}
        >
          {/* Top row: severity + code + status + cost */}
          <View style={styles.cardTopRow}>
            <View style={styles.codeContainer}>
              <Text style={styles.severityIcon}>{getSeverityIcon(code.severity)}</Text>
              <Text style={styles.codeText}>{code.code}</Text>
            </View>
            <View style={styles.cardTopRight}>
              {showStatus && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(code.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(code.status) },
                    ]}
                  >
                    {getDtcStatusLabel(code.status)}
                  </Text>
                </View>
              )}
              {showCost && (
                code.estimatedRepairCost ? (
                  <Text style={styles.costText}>
                    ${code.estimatedRepairCost.min}-${code.estimatedRepairCost.max}
                  </Text>
                ) : (
                  <Text style={styles.costTextNA}>N/A</Text>
                )
              )}
            </View>
          </View>
          {/* Bottom row: full description */}
          <Text style={styles.descText}>
            {code.description}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Simplified code list for compact displays
export const CodeList: React.FC<{
  codes: DtcCode[];
  maxItems?: number;
}> = ({ codes, maxItems = 5 }) => {
  const displayCodes = codes.slice(0, maxItems);
  const remaining = codes.length - maxItems;

  return (
    <View style={styles.listContainer}>
      {displayCodes.map((code) => (
        <View key={code.id} style={styles.listItem}>
          <View style={styles.listItemLeft}>
            <Text style={styles.listSeverityIcon}>{getSeverityIcon(code.severity)}</Text>
            <Text style={styles.listCodeText}>{code.code}</Text>
          </View>
          <Text style={styles.listDescText} numberOfLines={1}>
            {code.description}
          </Text>
        </View>
      ))}
      {remaining > 0 && (
        <Text style={styles.moreText}>+{remaining} more codes</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.inputRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  codeCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  codeCardLast: {
    borderBottomWidth: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityIcon: {
    fontSize: 10,
    marginRight: spacing.xs,
  },
  codeText: {
    ...typography.styles.label,
    color: colors.primary.navy,
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
  },
  descText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    ...typography.styles.caption,
    fontWeight: typography.fontWeight.medium,
    fontSize: 11,
  },
  costText: {
    ...typography.styles.caption,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  costTextNA: {
    ...typography.styles.caption,
    color: colors.text.light,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    color: colors.status.success,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.text.muted,
  },
  // List styles
  listContainer: {
    gap: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  listSeverityIcon: {
    fontSize: 8,
    marginRight: spacing.xs,
  },
  listCodeText: {
    ...typography.styles.caption,
    color: colors.primary.navy,
    fontFamily: 'monospace',
    fontWeight: typography.fontWeight.semiBold,
  },
  listDescText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  moreText: {
    ...typography.styles.caption,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
});
