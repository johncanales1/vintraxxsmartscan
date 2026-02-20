// HistoryScreen for VinTraxx SmartScan
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { StatusBadge } from '../components/StatusBadge';
import { ConditionReport } from '../models/ConditionReport';
import { mockVehicles, getVehicleDisplayName, formatMileage } from '../models/Vehicle';
import { useAppStore } from '../store/appStore';

// Import SVG icons
import CarIcon from '../assets/icons/car.svg';
import WarningIcon from '../assets/icons/warning.svg';
import CheckIcon from '../assets/icons/check.svg';
import HistoryIcon from '../assets/icons/history.svg';

interface HistoryScreenProps {
  navigation: any;
}

interface HistoryItem {
  id: string;
  report: ConditionReport;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [filter, setFilter] = useState<'all' | 'issues' | 'clean'>('all');
  
  // Get saved reports from store
  const { savedReports } = useAppStore();

  const filteredHistory = savedReports.map(report => ({ id: report.id, report })).filter((item) => {
    if (filter === 'all') return true;
    const hasIssues = item.report.activeDtcCodes.length > 0 || 
                      item.report.pendingDtcCodes.length > 0 ||
                      item.report.repairsNeeded.length > 0;
    return filter === 'issues' ? hasIssues : !hasIssues;
  });

  const handleReportPress = (report: ConditionReport) => {
    navigation.navigate('Report', { report });
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

  const formatCurrency = (amount: number): string => {
    return '$' + amount.toLocaleString();
  };

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    const { report } = item;
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
            <Text style={styles.cardDate}>{formatDate(report.scanDate)}</Text>
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
          <Text style={styles.cardArrow}>›</Text>
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
            <Text style={[
              styles.statValue,
              totalCodes > 0 && styles.statValueWarning,
            ]}>
              {totalCodes}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Repairs</Text>
            <Text style={[
              styles.statValue,
              report.repairsNeeded.length > 0 && styles.statValueWarning,
            ]}>
              {report.repairsNeeded.length}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Est. Cost</Text>
            <Text style={[
              styles.statValue,
              styles.statValueCost,
              report.totalRepairCost > 0 && styles.statValueWarning,
            ]}>
              {formatCurrency(report.totalRepairCost)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan History</Text>
        <Text style={styles.headerSubtitle}>
          {savedReports.length} scan{savedReports.length !== 1 ? 's' : ''} recorded
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({savedReports.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'issues' && styles.filterTabActive]}
          onPress={() => setFilter('issues')}
        >
          <Text style={[styles.filterText, filter === 'issues' && styles.filterTextActive]}>
            Issues ({savedReports.filter(report => 
              report.activeDtcCodes.length > 0 || 
              report.pendingDtcCodes.length > 0 ||
              report.repairsNeeded.length > 0
            ).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'clean' && styles.filterTabActive]}
          onPress={() => setFilter('clean')}
        >
          <Text style={[styles.filterText, filter === 'clean' && styles.filterTextActive]}>
            Clear ({savedReports.filter(report => 
              report.activeDtcCodes.length === 0 && 
              report.pendingDtcCodes.length === 0 &&
              report.repairsNeeded.length === 0
            ).length})
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
            <Text style={styles.emptyTitle}>No Scans Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'all'
                ? 'Your scan history will appear here'
                : `No scans matching "${filter}" filter`}
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
  },
  cardDate: {
    ...typography.styles.label,
    color: colors.text.primary,
  },
  cardArrow: {
    fontSize: 24,
    color: colors.text.light,
    fontWeight: '300',
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
