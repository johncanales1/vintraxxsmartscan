// CleanReportScreen for VinTraxx SmartScan
// Shows ONLY direct scanned data from the vehicle - no AI processing
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { ConditionReport } from '../models/ConditionReport';
import { getVehicleDisplayName, formatMileage } from '../models/Vehicle';
import { getFuelSystemStatusLabel, getSecondaryAirStatusLabel } from '../services/obd/utils';

import ShareIcon from '../assets/icons/share.svg';
import CarIcon from '../assets/icons/car.svg';
import DiagCodeIcon from '../assets/icons/diagtrcode.svg';
import ScanInfoIcon from '../assets/icons/scaninfo.svg';
import CheckIcon from '../assets/icons/check.svg';
import IssuesIcon from '../assets/icons/issues.svg';

interface CleanReportScreenProps {
  navigation: any;
  route: {
    params: {
      report: ConditionReport;
    };
  };
}

export const CleanReportScreen: React.FC<CleanReportScreenProps> = ({ navigation, route }) => {
  const report = route.params.report;

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleShare = async () => {
    try {
      const codes = [...report.activeDtcCodes, ...report.pendingDtcCodes];
      await Share.share({
        title: 'Vehicle Scan Data',
        message: `Vehicle Scan Data\n${getVehicleDisplayName(report.vehicle)}\nVIN: ${report.vehicle.vin}\nDTC Codes: ${codes.length > 0 ? codes.map(c => c.code).join(', ') : 'None'}\nMIL: ${report.celStatus ? 'ON' : 'OFF'}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const allCodes = [...report.activeDtcCodes, ...report.pendingDtcCodes];
  const storedCodes = report.activeDtcCodes;
  const pendingCodes = report.pendingDtcCodes;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Clean Report</Text>
              <Text style={styles.headerSubtitle}>Direct scanned data only</Text>
            </View>
            <Button
              title="Share"
              onPress={handleShare}
              variant="ghost"
              size="small"
              icon={<ShareIcon width={16} height={16} color={colors.primary.navy} />}
            />
          </View>
          <Text style={styles.headerDate}>{formatDate(report.scanDate)}</Text>
        </View>

        {/* MIL Status Banner */}
        <View style={[
          styles.milBanner,
          report.celStatus ? styles.milBannerOn : styles.milBannerOff,
        ]}>
          <View style={styles.milIconWrap}>
            {report.celStatus
              ? <IssuesIcon width={24} height={24} color={colors.status.error} />
              : <CheckIcon width={24} height={24} color={colors.status.success} />
            }
          </View>
          <View style={styles.milTextWrap}>
            <Text style={styles.milTitle}>
              Check Engine Light: {report.celStatus ? 'ON' : 'OFF'}
            </Text>
            <Text style={styles.milSubtitle}>
              {report.dtcCountFromECU ?? allCodes.length} DTC(s) reported by ECU
            </Text>
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CarIcon width={20} height={20} color={colors.primary.navy} />
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
          </View>
          <View style={styles.card}>
            <DataRow label="VIN" value={report.vehicle.vin} />
            <DataRow label="Year / Make / Model" value={getVehicleDisplayName(report.vehicle)} />
            <DataRow label="Mileage" value={formatMileage(report.scanMileage)} />
            {report.odometerEcu && (
              <DataRow label="Odometer ECU" value={report.odometerEcu} isLast />
            )}
          </View>
        </View>

        {/* Stored DTC Codes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DiagCodeIcon width={20} height={20} color={storedCodes.length > 0 ? colors.status.error : colors.status.success} />
            <Text style={styles.sectionTitle}>Stored DTC Codes</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{storedCodes.length}</Text>
            </View>
          </View>
          <View style={styles.card}>
            {storedCodes.length > 0 ? (
              storedCodes.map((dtc, i) => (
                <View key={dtc.id} style={[styles.codeRow, i === storedCodes.length - 1 && styles.codeRowLast]}>
                  <Text style={styles.codeValue}>{dtc.code}</Text>
                  <Text style={styles.codeDesc} numberOfLines={2}>{dtc.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No stored codes</Text>
            )}
          </View>
        </View>

        {/* Pending DTC Codes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DiagCodeIcon width={20} height={20} color={pendingCodes.length > 0 ? colors.status.warning : colors.status.success} />
            <Text style={styles.sectionTitle}>Pending DTC Codes</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCodes.length}</Text>
            </View>
          </View>
          <View style={styles.card}>
            {pendingCodes.length > 0 ? (
              pendingCodes.map((dtc, i) => (
                <View key={dtc.id} style={[styles.codeRow, i === pendingCodes.length - 1 && styles.codeRowLast]}>
                  <Text style={styles.codeValue}>{dtc.code}</Text>
                  <Text style={styles.codeDesc} numberOfLines={2}>{dtc.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No pending codes</Text>
            )}
          </View>
        </View>

        {/* Scan Data */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ScanInfoIcon width={20} height={20} color={colors.primary.navy} />
            <Text style={styles.sectionTitle}>Scan Data</Text>
          </View>
          <View style={styles.card}>
            <DataRow
              label="Distance Since Cleared"
              value={report.codesLastReset.milesSinceReset > 0
                ? `${report.codesLastReset.milesSinceReset.toFixed(1)} mi`
                : 'N/A'}
            />
            <DataRow
              label="Time Since Cleared"
              value={report.codesLastReset.daysSinceReset > 0
                ? `${report.codesLastReset.daysSinceReset} days`
                : 'N/A'}
            />
            <DataRow
              label="Warmups Since Cleared"
              value={report.warmupsSinceCleared !== undefined ? `${report.warmupsSinceCleared}` : 'N/A'}
            />
            <DataRow
              label="Distance With MIL On"
              value={report.milesWithMILOn !== undefined ? `${report.milesWithMILOn.toFixed(1)} mi` : 'N/A'}
            />

            {/* Per-ECU MIL Status */}
            {report.milStatusByEcu && Object.keys(report.milStatusByEcu).length > 0 && (
              <>
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionTitle}>MIL Status by ECU</Text>
                </View>
                {Object.entries(report.milStatusByEcu).map(([ecu, status]) => (
                  <DataRow
                    key={ecu}
                    label={`ECU ${ecu}`}
                    value={`MIL: ${status.milOn ? 'ON' : 'OFF'} | DTCs: ${status.dtcCount}`}
                  />
                ))}
              </>
            )}

            {/* Fuel System Status */}
            {report.fuelSystemStatusByEcu && Object.keys(report.fuelSystemStatusByEcu).length > 0 && (
              <>
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionTitle}>Fuel System Status</Text>
                </View>
                {Object.entries(report.fuelSystemStatusByEcu).map(([ecu, status]) => (
                  <DataRow
                    key={ecu}
                    label={`ECU ${ecu}`}
                    value={getFuelSystemStatusLabel(status.system1)}
                  />
                ))}
              </>
            )}

            {/* Secondary Air Status */}
            {report.secondaryAirStatusByEcu && Object.keys(report.secondaryAirStatusByEcu).length > 0 && (
              <>
                <View style={styles.subSectionHeader}>
                  <Text style={styles.subSectionTitle}>Secondary Air System</Text>
                </View>
                {Object.entries(report.secondaryAirStatusByEcu).map(([ecu, status]) => (
                  <DataRow
                    key={ecu}
                    label={`ECU ${ecu}`}
                    value={getSecondaryAirStatusLabel(status)}
                    isLast
                  />
                ))}
              </>
            )}
          </View>
        </View>

        {/* Emissions Monitor Readiness */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckIcon width={20} height={20} color={report.emissionsCheck.status === 'passed' ? colors.status.success : colors.status.error} />
            <Text style={styles.sectionTitle}>Emissions Monitor Readiness</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.monitorSummary}>
              <View style={styles.monitorStat}>
                <Text style={[styles.monitorStatValue, { color: colors.status.success }]}>
                  {report.emissionsCheck.readyMonitors}
                </Text>
                <Text style={styles.monitorStatLabel}>Ready</Text>
              </View>
              <View style={styles.monitorDivider} />
              <View style={styles.monitorStat}>
                <Text style={[styles.monitorStatValue, report.emissionsCheck.notReadyMonitors > 0 && { color: colors.status.error }]}>
                  {report.emissionsCheck.notReadyMonitors}
                </Text>
                <Text style={styles.monitorStatLabel}>Not Ready</Text>
              </View>
              <View style={styles.monitorDivider} />
              <View style={styles.monitorStat}>
                <Text style={styles.monitorStatValue}>{report.emissionsCheck.totalMonitors}</Text>
                <Text style={styles.monitorStatLabel}>Total</Text>
              </View>
            </View>
            {report.emissionsCheck.monitors
              .filter(m => m.status !== 'not_applicable')
              .map((monitor, index, arr) => (
                <View key={index} style={[styles.monitorRow, index === arr.length - 1 && styles.monitorRowLast]}>
                  <Text style={styles.monitorName}>{monitor.name}</Text>
                  <Text style={[
                    styles.monitorStatus,
                    monitor.status === 'ready' ? styles.monitorReady : styles.monitorNotReady,
                  ]}>
                    {monitor.status === 'ready' ? 'Ready' : 'Not Ready'}
                  </Text>
                </View>
              ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Scanned with VinTraxx SmartScan</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Reusable data row component
const DataRow: React.FC<{ label: string; value: string; isLast?: boolean }> = ({ label, value, isLast }) => (
  <View style={[styles.dataRow, !isLast && styles.dataRowBorder]}>
    <Text style={styles.dataLabel}>{label}</Text>
    <Text style={styles.dataValue} numberOfLines={2}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['4xl'],
  },
  // Header
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.styles.h3,
    color: colors.primary.navy,
  },
  headerSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerDate: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  // MIL Banner
  milBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  milBannerOff: {
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.success,
  },
  milBannerOn: {
    backgroundColor: colors.status.errorLight,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  milIconWrap: {
    marginRight: spacing.md,
  },
  milTextWrap: {
    flex: 1,
  },
  milTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
  },
  milSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  // Sections
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.primary.navy,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  // Data rows
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dataRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dataLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  // Code rows
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.md,
  },
  codeRowLast: {
    borderBottomWidth: 0,
  },
  codeValue: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.navy,
    width: 80,
  },
  codeDesc: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  emptyText: {
    ...typography.styles.body,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  // Sub-sections
  subSectionHeader: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  // Monitor rows
  monitorSummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  monitorStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  monitorStatValue: {
    ...typography.styles.h3,
    color: colors.text.primary,
  },
  monitorStatLabel: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  monitorDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.light,
  },
  monitorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  monitorRowLast: {
    borderBottomWidth: 0,
  },
  monitorName: {
    ...typography.styles.caption,
    color: colors.text.primary,
  },
  monitorStatus: {
    fontSize: 12,
    fontWeight: typography.fontWeight.semiBold,
  },
  monitorReady: {
    color: colors.status.success,
  },
  monitorNotReady: {
    color: colors.status.error,
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  footerText: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
});
