// HistoryScreen for VinTraxx SmartScan
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { StatusBadge } from '../components/StatusBadge';
import { ConditionReport } from '../models/ConditionReport';
import { getVehicleDisplayName, formatMileage } from '../models/Vehicle';
import { useAppStore, SavedAppraisal } from '../store/appStore';

// Import SVG icons
import CarIcon from '../assets/icons/car.svg';
import WarningIcon from '../assets/icons/warning.svg';
import CheckIcon from '../assets/icons/check.svg';
import HistoryIcon from '../assets/icons/history.svg';

interface HistoryScreenProps {
  navigation: any;
}

type HistoryItemType = 'obd' | 'appraisal';

interface UnifiedHistoryItem {
  id: string;
  type: HistoryItemType;
  date: Date;
  report?: ConditionReport;
  appraisal?: SavedAppraisal;
}

const formatCurrency = (amount: number): string => {
  return '$' + amount.toLocaleString();
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [filter, setFilter] = useState<'all' | 'obd' | 'appraisal'>('all');

  const { savedReports, savedAppraisals, removeSavedReport, removeSavedAppraisal } = useAppStore();

  // Build unified history list sorted by date (newest first)
  const unifiedHistory: UnifiedHistoryItem[] = useMemo(() => {
    const items: UnifiedHistoryItem[] = [];

    savedReports.forEach(report => {
      items.push({
        id: 'obd-' + report.id,
        type: 'obd',
        date: report.scanDate instanceof Date ? report.scanDate : new Date(report.scanDate),
        report,
      });
    });

    savedAppraisals.forEach(appraisal => {
      items.push({
        id: 'appr-' + appraisal.id,
        type: 'appraisal',
        date: appraisal.createdAt instanceof Date ? appraisal.createdAt : new Date(appraisal.createdAt),
        appraisal,
      });
    });

    items.sort((a, b) => b.date.getTime() - a.date.getTime());
    return items;
  }, [savedReports, savedAppraisals]);

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return unifiedHistory;
    return unifiedHistory.filter(item => item.type === filter);
  }, [unifiedHistory, filter]);

  const totalCount = unifiedHistory.length;
  const obdCount = unifiedHistory.filter(i => i.type === 'obd').length;
  const appraisalCount = unifiedHistory.filter(i => i.type === 'appraisal').length;

  const handleReportPress = (report: ConditionReport) => {
    navigation.navigate('Report', { report });
  };

  const handleDeleteItem = (item: UnifiedHistoryItem) => {
    const label = item.type === 'obd' ? 'OBD scan report' : 'Appraisal report';
    Alert.alert(
      'Delete Report',
      `Are you sure you want to delete this ${label}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (item.type === 'obd' && item.report) {
              removeSavedReport(item.report.id);
            } else if (item.type === 'appraisal' && item.appraisal) {
              removeSavedAppraisal(item.appraisal.id);
            }
          },
        },
      ],
    );
  };

  const renderObdCard = (item: UnifiedHistoryItem) => {
    const report = item.report!;
    const hasIssues = report.activeDtcCodes.length > 0 ||
                      report.pendingDtcCodes.length > 0 ||
                      report.repairsNeeded.length > 0;
    const totalCodes = report.activeDtcCodes.length + report.pendingDtcCodes.length;

    return (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handleReportPress(report)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            <StatusBadge
              label={hasIssues ? 'Issues Found' : 'All Clear'}
              variant={hasIssues ? 'warning' : 'success'}
              icon={hasIssues
                ? <WarningIcon width={12} height={12} color={colors.status.warning} />
                : <CheckIcon width={12} height={12} color={colors.status.success} />
              }
              size="small"
            />
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={styles.typeBadgeObd}>
              <Text style={styles.typeBadgeText}>OBD</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteItem(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIconContainer}>
              <CarIcon width={24} height={24} color={colors.primary.navy} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {getVehicleDisplayName(report.vehicle)}
              </Text>
              <Text style={styles.vehicleMileage}>
                {formatMileage(report.scanMileage)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Codes</Text>
            <Text style={[styles.statValue, totalCodes > 0 && styles.statValueWarning]}>
              {totalCodes}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Repairs</Text>
            <Text style={[styles.statValue, report.repairsNeeded.length > 0 && styles.statValueWarning]}>
              {report.repairsNeeded.length}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Est. Cost</Text>
            <Text style={[styles.statValue, styles.statValueCost, report.totalRepairCost > 0 && styles.statValueWarning]}>
              {formatCurrency(report.totalRepairCost)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderAppraisalCard = (item: UnifiedHistoryItem) => {
    const appraisal = item.appraisal!;
    const val = appraisal.valuation;
    const tradeRange = `${formatCurrency(val.estimatedTradeInLow)} – ${formatCurrency(val.estimatedTradeInHigh)}`;

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            <StatusBadge
              label={val.confidenceLevel.toUpperCase()}
              variant={val.confidenceLevel === 'high' ? 'success' : val.confidenceLevel === 'medium' ? 'warning' : 'error'}
              icon={<CheckIcon width={12} height={12} color={val.confidenceLevel === 'high' ? colors.status.success : colors.status.warning} />}
              size="small"
            />
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={styles.typeBadgeAppraisal}>
              <Text style={styles.typeBadgeText}>Appraisal</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteItem(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIconContainer}>
              <CarIcon width={24} height={24} color={colors.status.success} />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName} numberOfLines={1}>
                {getVehicleDisplayName(appraisal.vehicle)}
              </Text>
              <Text style={styles.vehicleMileage}>
                {formatMileage(appraisal.mileage)} · {appraisal.condition.charAt(0).toUpperCase() + appraisal.condition.slice(1)}
              </Text>
            </View>
          </View>

          {/* Appraisal Summary */}
          <View style={styles.appraisalSummary}>
            <View style={styles.appraisalValueRow}>
              <Text style={styles.appraisalValueLabel}>Trade-In Range</Text>
              <Text style={styles.appraisalValueAmount}>{tradeRange}</Text>
            </View>
            <View style={styles.appraisalValueRow}>
              <Text style={styles.appraisalValueLabel}>Retail Range</Text>
              <Text style={styles.appraisalValueAmountSecondary}>
                {formatCurrency(val.estimatedRetailLow)} – {formatCurrency(val.estimatedRetailHigh)}
              </Text>
            </View>
            {appraisal.healthScore !== undefined && (
              <View style={styles.appraisalValueRow}>
                <Text style={styles.appraisalValueLabel}>Health Score</Text>
                <Text style={[styles.appraisalValueAmountSecondary, {
                  color: appraisal.healthScore >= 80 ? colors.status.success :
                    appraisal.healthScore >= 50 ? colors.status.warning : colors.status.error,
                }]}>
                  {appraisal.healthScore}/100
                </Text>
              </View>
            )}
          </View>

          {/* Photo Thumbnails */}
          {appraisal.photoUris.length > 0 && (
            <View style={styles.photoRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {appraisal.photoUris.map((uri, idx) => (
                  <Image
                    key={idx}
                    source={{ uri }}
                    style={styles.photoThumb}
                  />
                ))}
              </ScrollView>
              <Text style={styles.photoCountLabel}>{appraisal.photoUris.length} photo{appraisal.photoUris.length !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Wholesale</Text>
            <Text style={[styles.statValue]}>
              {formatCurrency(val.estimatedWholesaleLow)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Trade-In</Text>
            <Text style={[styles.statValue, styles.statValueSuccess]}>
              {formatCurrency(val.estimatedTradeInLow)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Retail</Text>
            <Text style={[styles.statValue]}>
              {formatCurrency(val.estimatedRetailLow)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Trend</Text>
            <Text style={[styles.statValue, {
              color: val.marketTrend === 'appreciating' ? colors.status.success :
                val.marketTrend === 'stable' ? colors.status.info : colors.status.warning,
            }]}>
              {val.marketTrend.charAt(0).toUpperCase() + val.marketTrend.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: UnifiedHistoryItem }) => {
    if (item.type === 'obd' && item.report) {
      return renderObdCard(item);
    }
    if (item.type === 'appraisal' && item.appraisal) {
      return renderAppraisalCard(item);
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <Text style={styles.headerSubtitle}>
          {totalCount} report{totalCount !== 1 ? 's' : ''} recorded
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({totalCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'obd' && styles.filterTabActive]}
          onPress={() => setFilter('obd')}
        >
          <Text style={[styles.filterText, filter === 'obd' && styles.filterTextActive]}>
            OBD ({obdCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'appraisal' && styles.filterTabActive]}
          onPress={() => setFilter('appraisal')}
        >
          <Text style={[styles.filterText, filter === 'appraisal' && styles.filterTextActive]}>
            Appraisals ({appraisalCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* History List */}
      <FlatList
        data={filteredHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <HistoryIcon width={48} height={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Your scan and appraisal history will appear here'
                : filter === 'obd'
                  ? 'No OBD scan reports yet'
                  : 'No appraisal reports yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.styles.h2,
    color: colors.primary.navy,
  },
  headerSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.buttonRadius,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterTabActive: {
    backgroundColor: colors.primary.navy,
    borderColor: colors.primary.navy,
  },
  filterText: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  filterTextActive: {
    color: colors.text.inverse,
  },
  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['3xl'],
  },
  historyCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardRadius,
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.cardPadding,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadgeObd: {
    backgroundColor: colors.primary.navy,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeBadgeAppraisal: {
    backgroundColor: colors.status.success,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeBadgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deleteText: {
    fontSize: 18,
    color: colors.text.light,
    paddingLeft: spacing.xs,
  },
  cardDate: {
    ...typography.styles.label,
    color: colors.text.primary,
  },
  cardBody: {
    padding: spacing.cardPadding,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIconContainer: {
    marginRight: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  vehicleMileage: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  appraisalSummary: {
    marginTop: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    padding: spacing.md,
    gap: spacing.xs,
  },
  appraisalValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appraisalValueLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
  },
  appraisalValueAmount: {
    ...typography.styles.label,
    color: colors.status.success,
    fontWeight: typography.fontWeight.bold,
  },
  appraisalValueAmountSecondary: {
    ...typography.styles.caption,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  photoRow: {
    marginTop: spacing.md,
  },
  photoThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: spacing.sm,
    backgroundColor: colors.border.light,
  },
  photoCountLabel: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.cardPadding,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginBottom: 2,
  },
  statValue: {
    ...typography.styles.label,
    color: colors.text.primary,
  },
  statValueCost: {
    fontWeight: typography.fontWeight.bold,
  },
  statValueWarning: {
    color: colors.status.warning,
  },
  statValueSuccess: {
    color: colors.status.success,
    fontWeight: typography.fontWeight.bold,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginVertical: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['5xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.styles.h4,
    color: colors.text.secondary,
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.text.muted,
    textAlign: 'center',
  },
});
