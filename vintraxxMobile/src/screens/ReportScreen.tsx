// ReportScreen for VinTraxx SmartScan - FIXD-style Condition Report
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { VehicleCard } from '../components/VehicleCard';
import { StatCard } from '../components/StatCard';
import { ReportSection, SimpleSection } from '../components/ReportSection';
import { CodeTable } from '../components/CodeTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConditionReport } from '../models/ConditionReport';
import { getVehicleDisplayName, formatMileage } from '../models/Vehicle';
import { RepairItem, getRepairPriorityLabel } from '../models/RepairItem';
import { useAppStore } from '../store/appStore';
import { clearedCodesHistory, ClearedCodeEntry } from '../services/storage/ClearedCodesHistory';
import { getFuelSystemStatusLabel, getSecondaryAirStatusLabel } from '../services/obd/utils';

// Import SVG icons
import ShareIcon from '../assets/icons/share.svg';
import CodeResetIcon from '../assets/icons/codereset.svg';
import IssuesIcon from '../assets/icons/issues.svg';
import CheckIcon from '../assets/icons/check.svg';
import CarIcon from '../assets/icons/car.svg';
import WalletIcon from '../assets/icons/wallet.svg';
import ToolIcon from '../assets/icons/tool.svg';
import EmisCheckIcon from '../assets/icons/emisncheck.svg';
import DiagCodeIcon from '../assets/icons/diagtrcode.svg';
import ScanInfoIcon from '../assets/icons/scaninfo.svg';
import SaveIcon from '../assets/icons/save.svg';
import SearchIcon from '../assets/icons/search.svg';

interface ReportScreenProps {
  navigation: any;
  route?: {
    params?: {
      report?: ConditionReport;
    };
  };
}

export const ReportScreen: React.FC<ReportScreenProps> = ({ navigation, route }) => {
  // Use provided report or show error
  const report = route?.params?.report;
  const { addSavedReport, savedReports } = useAppStore();
  const [clearedCodes, setClearedCodes] = useState<ClearedCodeEntry[]>([]);
  
  // Handle Save Report button
  const handleSaveReport = () => {
    if (!report) return;
    
    // Check if report is already saved
    const alreadySaved = savedReports.some(r => r.id === report.id);
    
    if (alreadySaved) {
      Alert.alert('Already Saved', 'This report has already been saved to your history.');
      return;
    }
    
    addSavedReport(report);
    Alert.alert('Report Saved', 'Your condition report has been saved to history.', [
      { text: 'OK' },
      { text: 'View History', onPress: () => navigation.navigate('Main', { screen: 'History' }) },
    ]);
  };

  // Handle Find Repair Shop button
  const handleFindRepairShop = () => {
    // Open maps app to search for nearby auto repair shops
    const searchQuery = encodeURIComponent('auto repair shop near me');
    const mapsUrl = `https://maps.google.com/maps?q=${searchQuery}`;
    
    Linking.canOpenURL(mapsUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(mapsUrl);
        } else {
          Alert.alert('Cannot Open Maps', 'Unable to open maps application.');
        }
      })
      .catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Error', 'Failed to open maps application.');
      });
  };
  
  if (!report) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No report data available</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return '$' + amount.toLocaleString();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Vehicle Condition Report',
        message: `Vehicle Condition Report\n${getVehicleDisplayName(report.vehicle)}\nVIN: ${report.vehicle.vin}\nTotal Repair Cost: ${formatCurrency(report.totalRepairCost)}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // Load cleared codes history for this VIN
  useEffect(() => {
    if (report?.vehicle?.vin && report.vehicle.vin !== 'UNKNOWN') {
      clearedCodesHistory.getRecentClearedCodes(report.vehicle.vin, 30)
        .then(codes => setClearedCodes(codes))
        .catch(err => console.error('Failed to load cleared codes:', err));
    }
  }, [report?.vehicle?.vin]);

  const allCodes = [...report.activeDtcCodes, ...report.pendingDtcCodes];
  const hasIssues = allCodes.length > 0 || report.repairsNeeded.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Header */}
        <View style={styles.reportHeader}>
          <View style={styles.reportTitleRow}>
            <Text style={styles.reportTitle}>Condition Report</Text>
            <Button
              title="Share"
              onPress={handleShare}
              variant="ghost"
              size="small"
              icon={<ShareIcon width={18} height={18} color={colors.primary.navy} />}
            />
          </View>
          <Text style={styles.reportDate}>{formatDate(report.scanDate)}</Text>
        </View>

        {/* Overall Status Banner */}
        <View style={[
          styles.statusBanner,
          hasIssues ? styles.statusBannerWarning : styles.statusBannerSuccess,
        ]}>
          <View style={styles.statusIconContainer}>
            {hasIssues 
              ? <IssuesIcon width={28} height={28} color={colors.status.warning} />
              : <CheckIcon width={28} height={28} color={colors.status.success} />
            }
          </View>
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>
              {hasIssues ? 'Issues Detected' : 'Vehicle Healthy'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {hasIssues
                ? `${allCodes.length} code(s) found, ${report.repairsNeeded.length} repair(s) recommended`
                : 'No issues detected during scan'}
            </Text>
          </View>
        </View>

        {/* Codes Last Reset Section */}
        <ReportSection
          title="Codes Last Reset"
          icon={<CodeResetIcon width={22} height={22} color={report.codesLastReset.status === 'clear' ? colors.status.success : colors.status.warning} />}
          variant={report.codesLastReset.status === 'clear' ? 'success' : 'warning'}
          headerRight={
            <StatusBadge
              label={report.codesLastReset.status === 'clear' ? 'Clear' : 'Codes Present'}
              variant={report.codesLastReset.status === 'clear' ? 'success' : 'warning'}
              size="small"
            />
          }
        >
          <View style={styles.codesResetContent}>
            <View style={styles.codesResetStat}>
              <Text style={styles.codesResetValue}>
                {report.codesLastReset.milesSinceReset.toLocaleString()}
              </Text>
              <Text style={styles.codesResetLabel}>miles ago</Text>
            </View>
            <View style={styles.codesResetDivider} />
            <View style={styles.codesResetStat}>
              <Text style={styles.codesResetValue}>
                {report.codesLastReset.daysSinceReset}
              </Text>
              <Text style={styles.codesResetLabel}>days ago</Text>
            </View>
          </View>
          {report.codesLastReset.note && (
            <Text style={styles.codesResetNote}>{report.codesLastReset.note}</Text>
          )}
        </ReportSection>

        {/* Vehicle Information */}
        <ReportSection
          title="Vehicle Information"
          icon={<CarIcon width={22} height={22} color={colors.primary.navy} />}
        >
          <View style={styles.vehicleInfoGrid}>
            <View style={styles.vehicleInfoRow}>
              <Text style={styles.vehicleInfoLabel}>VIN</Text>
              <Text style={styles.vehicleInfoValue}>{report.vehicle.vin}</Text>
            </View>
            <View style={styles.vehicleInfoRow}>
              <Text style={styles.vehicleInfoLabel}>Year/Make/Model</Text>
              <Text style={styles.vehicleInfoValue}>
                {getVehicleDisplayName(report.vehicle)}
              </Text>
            </View>
            <View style={[styles.vehicleInfoRow, styles.vehicleInfoRowLast]}>
              <Text style={styles.vehicleInfoLabel}>Mileage</Text>
              <Text style={styles.vehicleInfoValue}>
                {formatMileage(report.scanMileage)}
              </Text>
            </View>
          </View>
        </ReportSection>

        {/* Estimated Reconditioning Costs */}
        <SimpleSection title="Estimated Reconditioning Costs">
          <View style={styles.costCardsRow}>
            <StatCard
              title="Total Cost"
              value={formatCurrency(report.totalRepairCost)}
              icon={<WalletIcon width={28} height={28} color={report.totalRepairCost > 0 ? colors.text.inverse : colors.status.success} />}
              variant={report.totalRepairCost > 0 ? 'primary' : 'success'}
              style={styles.costCardMain}
            />
            <View style={styles.costCardsSecondary}>
              <StatCard
                title="Top Repair"
                value={formatCurrency(report.topRepairCost)}
                variant="warning"
                style={styles.costCardSmall}
              />
              <StatCard
                title="Other Costs"
                value={formatCurrency(report.otherRepairsCost)}
                variant="default"
                style={styles.costCardSmall}
              />
            </View>
          </View>
        </SimpleSection>

        {/* Additional Repairs May Be Necessary */}
        <ReportSection
          title="Additional Repairs May Be Necessary"
          icon={<ToolIcon width={22} height={22} color={report.repairsNeeded.length > 0 ? colors.status.warning : colors.status.success} />}
          variant={report.repairsNeeded.length > 0 ? 'warning' : 'success'}
        >
          {report.repairsNeeded.length > 0 ? (
            <View style={styles.repairsList}>
              {report.repairsNeeded.map((repair: RepairItem) => (
                <View key={repair.id} style={styles.repairItem}>
                  <View style={styles.repairItemHeader}>
                    <View style={styles.repairItemTitleRow}>
                      <Text style={styles.repairItemName}>{repair.name}</Text>
                      <StatusBadge
                        label={getRepairPriorityLabel(repair.priority)}
                        variant={
                          repair.priority === 'urgent'
                            ? 'error'
                            : repair.priority === 'recommended'
                            ? 'warning'
                            : 'info'
                        }
                        size="small"
                      />
                    </View>
                    <Text style={styles.repairItemCost}>
                      {formatCurrency(repair.estimatedCost.total)}
                    </Text>
                  </View>
                  {repair.description && (
                    <Text style={styles.repairItemDesc}>{repair.description}</Text>
                  )}
                  <View style={styles.repairItemBreakdown}>
                    <Text style={styles.repairBreakdownText}>
                      Labor: {formatCurrency(repair.estimatedCost.labor)} • Parts: {formatCurrency(repair.estimatedCost.parts)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noRepairsContainer}>
              <CheckIcon width={48} height={48} color={colors.status.success} />
              <Text style={styles.noRepairsTitle}>No Repairs Necessary</Text>
              <Text style={styles.noRepairsText}>
                Your vehicle is in great condition!
              </Text>
            </View>
          )}
        </ReportSection>

        {/* Emissions Check */}
        <ReportSection
          title="Emissions Check"
          icon={<EmisCheckIcon width={22} height={22} color={report.emissionsCheck.status === 'passed' ? colors.status.success : colors.status.error} />}
          variant={report.emissionsCheck.status === 'passed' ? 'success' : 'error'}
          headerRight={
            <StatusBadge
              label={report.emissionsCheck.status === 'passed' ? 'PASSED' : 'FAILED'}
              variant={report.emissionsCheck.status === 'passed' ? 'success' : 'error'}
              icon={report.emissionsCheck.status === 'passed' ? <CheckIcon width={14} height={14} color={colors.status.success} /> : '✕'}
            />
          }
        >
          <View style={styles.emissionsStats}>
            <View style={styles.emissionsStat}>
              <Text style={styles.emissionsStatValue}>
                {report.emissionsCheck.readyMonitors}
              </Text>
              <Text style={styles.emissionsStatLabel}>Monitors Ready</Text>
            </View>
            <View style={styles.emissionsStatDivider} />
            <View style={styles.emissionsStat}>
              <Text style={[
                styles.emissionsStatValue,
                report.emissionsCheck.notReadyMonitors > 0 && styles.emissionsStatValueWarning,
              ]}>
                {report.emissionsCheck.notReadyMonitors}
              </Text>
              <Text style={styles.emissionsStatLabel}>Not Ready</Text>
            </View>
            <View style={styles.emissionsStatDivider} />
            <View style={styles.emissionsStat}>
              <Text style={styles.emissionsStatValue}>
                {report.emissionsCheck.totalMonitors}
              </Text>
              <Text style={styles.emissionsStatLabel}>Total</Text>
            </View>
          </View>

          {/* Monitors List */}
          <View style={styles.monitorsList}>
            {report.emissionsCheck.monitors
              .filter(m => m.status !== 'not_applicable')
              .map((monitor, index, arr) => (
                <View key={index} style={[styles.monitorItem, index === arr.length - 1 && styles.monitorItemLast]}>
                  <Text style={styles.monitorName}>{monitor.name}</Text>
                  <View style={[
                    styles.monitorStatus,
                    monitor.status === 'ready' 
                      ? styles.monitorStatusReady 
                      : styles.monitorStatusNotReady,
                  ]}>
                    <View style={styles.monitorStatusContent}>
                      {monitor.status === 'ready' && <CheckIcon width={14} height={14} color={colors.status.success} />}
                      <Text style={[
                        styles.monitorStatusText,
                        monitor.status === 'ready'
                          ? styles.monitorStatusTextReady
                          : styles.monitorStatusTextNotReady,
                      ]}>
                        {monitor.status === 'ready' ? ' Ready' : '○ Not Ready'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </ReportSection>

        {/* Diagnostic Trouble Codes */}
        <ReportSection
          title="Diagnostic Trouble Codes"
          subtitle={`${allCodes.length} code(s) detected`}
          icon={<DiagCodeIcon width={22} height={22} color={allCodes.length > 0 ? colors.status.error : colors.status.success} />}
          variant={allCodes.length > 0 ? 'error' : 'success'}
        >
          <CodeTable
            codes={allCodes}
            showStatus
            showCost
            emptyMessage="No diagnostic trouble codes found"
          />
        </ReportSection>

        {/* Most Recent Cleared Codes */}
        {clearedCodes.length > 0 && (
          <ReportSection
            title="Most Recent Cleared Codes"
            subtitle={`${clearedCodes.length} code(s) cleared in last 30 days`}
            icon={<CodeResetIcon width={22} height={22} color={colors.primary.navy} />}
            variant="default"
          >
            <CodeTable
              codes={clearedCodes.map((code, index) => ({
                id: `cleared-${index}`,
                code: code.code,
                description: code.description,
                status: 'cleared' as const,
                severity: 'info' as const,
                category: 'powertrain' as const,
                detectedAt: new Date(code.clearedAt),
              }))}
              showStatus
              emptyMessage="No recently cleared codes"
            />
            <Text style={styles.clearedCodesNote}>
              These codes were cleared from this vehicle in the last 30 days.
            </Text>
          </ReportSection>
        )}

        {/* Additional Scan Information */}
        <ReportSection
          title="Additional Scan Information"
          subtitle="Detailed diagnostic data from your vehicle"
          icon={<ScanInfoIcon width={22} height={22} color={colors.primary.navy} />}
          variant="default"
        >
          <View style={styles.additionalInfoGrid}>
            {/* Miles Since Cleared */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Miles Since Cleared</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {report.codesLastReset.milesSinceReset.toFixed(1)} mi
                </Text>
                {report.distanceWithMILOnByEcu && Object.keys(report.distanceWithMILOnByEcu).length > 0 && (
                  <Text style={styles.infoResponse}>
                    Response: {Object.keys(report.distanceWithMILOnByEcu)[0]}
                  </Text>
                )}
              </View>
            </View>

            {/* Warmups Since Cleared */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Warmups Since Cleared</Text>
              <Text style={styles.infoValue}>
                {report.warmupsSinceCleared ?? 'N/A'}
              </Text>
            </View>

            {/* Miles With Light Active */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Miles With Light Active</Text>
              <View style={styles.infoValueContainer}>
                {report.distanceWithMILOnByEcu && Object.keys(report.distanceWithMILOnByEcu).length > 0 ? (
                  Object.entries(report.distanceWithMILOnByEcu).map(([ecu, miles]) => (
                    <View key={ecu} style={styles.infoValueWithResponse}>
                      <Text style={styles.infoValue}>
                        {miles.toFixed(1)} mi
                      </Text>
                      <Text style={styles.infoResponse}>Response: {ecu}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.infoValue}>
                    {report.milesWithMILOn !== undefined ? `${report.milesWithMILOn.toFixed(1)} mi` : 'N/A'}
                  </Text>
                )}
              </View>
            </View>

            {/* Odometer Responses */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Odometer Responses</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>
                  {formatMileage(report.scanMileage)}
                </Text>
                <Text style={styles.infoResponse}>
                  Response: {report.odometerEcu || 'N/A'}
                </Text>
              </View>
            </View>

            {/* VIN Responses */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>VIN Responses</Text>
              <View style={styles.infoValueContainer}>
                <Text style={styles.infoValue}>{report.vehicle.vin}</Text>
                <Text style={styles.infoResponse}>Response: 07E8</Text>
              </View>
            </View>

            {/* Check Engine Light Status */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Check Engine Light Status</Text>
              <View style={styles.infoValueContainer}>
                {report.milStatusByEcu && Object.keys(report.milStatusByEcu).length > 0 ? (
                  Object.entries(report.milStatusByEcu).map(([ecu, status]) => (
                    <View key={ecu} style={styles.infoValueWithResponse}>
                      <Text style={[styles.infoValue, status.milOn ? styles.infoValueError : styles.infoValueSuccess]}>
                        {status.milOn ? 'On' : 'Off'}
                      </Text>
                      <Text style={styles.infoResponse}>Response: {ecu}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.infoValueWithResponse}>
                    <Text style={[styles.infoValue, report.celStatus ? styles.infoValueError : styles.infoValueSuccess]}>
                      {report.celStatus ? 'On' : 'Off'}
                    </Text>
                    <Text style={styles.infoResponse}>Response: 07E8</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Basic Code Stored DTC Count */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Basic Code Stored DTC Count</Text>
              <Text style={styles.infoValue}>{report.dtcCountFromECU ?? report.activeDtcCodes.length}</Text>
            </View>

            {/* Loop Status */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Loop Status</Text>
              <View style={styles.infoValueContainer}>
                {report.fuelSystemStatusByEcu && Object.keys(report.fuelSystemStatusByEcu).length > 0 ? (
                  Object.entries(report.fuelSystemStatusByEcu).map(([ecu, status]) => (
                    <View key={ecu} style={styles.infoValueWithResponse}>
                      <Text style={styles.infoValue}>
                        {getFuelSystemStatusLabel(status.system1)}
                      </Text>
                      <Text style={styles.infoResponse}>Response: {ecu}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.infoValue}>
                    {report.loopStatus ?? 'N/A'}
                  </Text>
                )}
              </View>
            </View>

            {/* Secondary Air System Status */}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Secondary Air System</Text>
              <View style={styles.infoValueContainer}>
                {report.secondaryAirStatusByEcu && Object.keys(report.secondaryAirStatusByEcu).length > 0 ? (
                  Object.entries(report.secondaryAirStatusByEcu).map(([ecu, status]) => (
                    <View key={ecu} style={styles.infoValueWithResponse}>
                      <Text style={styles.infoValue}>
                        {getSecondaryAirStatusLabel(status)}
                      </Text>
                      <Text style={styles.infoResponse}>Response: {ecu}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.infoValue}>
                    {report.secondaryAirStatus ?? 'N/A'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </ReportSection>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Save Report"
            onPress={handleSaveReport}
            variant="secondary"
            size="medium"
            icon={<SaveIcon width={20} height={20} color={colors.text.inverse} />}
            fullWidth
          />
          <Button
            title="Find Repair Shop"
            onPress={handleFindRepairShop}
            variant="ghost"
            size="medium"
            icon={<SearchIcon width={20} height={20} color={colors.primary.navy} />}
            fullWidth
            style={styles.secondaryAction}
          />
        </View>

        {/* Scanner Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Scanned with VinTraxx SmartScan
          </Text>
          {report.scannerSerialNumber && (
            <Text style={styles.footerSerial}>
              S/N: {report.scannerSerialNumber}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  errorText: {
    ...typography.styles.h3,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing['4xl'],
  },
  reportHeader: {
    paddingVertical: spacing.lg,
  },
  reportTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    ...typography.styles.h3,
    color: colors.primary.navy,
  },
  reportDate: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.cardPadding,
    borderRadius: spacing.cardRadius,
    marginBottom: spacing.lg,
  },
  statusBannerSuccess: {
    backgroundColor: colors.status.successLight,
    borderWidth: 1,
    borderColor: colors.status.success,
  },
  statusBannerWarning: {
    backgroundColor: colors.status.warningLight,
    borderWidth: 1,
    borderColor: colors.status.warning,
  },
  statusIconContainer: {
    marginRight: spacing.md,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    ...typography.styles.label,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  statusSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  codesResetContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  codesResetStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  codesResetValue: {
    ...typography.styles.h3,
    color: colors.primary.navy,
  },
  codesResetLabel: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  codesResetDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
  },
  codesResetNote: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  vehicleInfoGrid: {
    gap: spacing.md,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  vehicleInfoRowLast: {
    borderBottomWidth: 0,
  },
  vehicleInfoLabel: {
    ...typography.styles.label,
    color: colors.text.secondary,
  },
  vehicleInfoValue: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  costCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  costCardMain: {
    flex: 0.5,
  },
  costCardsSecondary: {
    flex: 0.5,
    gap: spacing.sm,
  },
  costCardSmall: {
    flex: 1,
  },
  repairsList: {
    gap: spacing.md,
  },
  repairItem: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.inputRadius,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.warning,
  },
  repairItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  repairItemTitleRow: {
    flex: 1,
    gap: spacing.sm,
  },
  repairItemName: {
    ...typography.styles.label,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  repairItemCost: {
    ...typography.styles.h4,
    color: colors.primary.navy,
  },
  repairItemDesc: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  repairItemBreakdown: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  repairBreakdownText: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  noRepairsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noRepairsIcon: {
    fontSize: 48,
    color: colors.status.success,
    marginBottom: spacing.md,
  },
  noRepairsTitle: {
    ...typography.styles.h4,
    color: colors.status.success,
    marginBottom: spacing.xs,
  },
  noRepairsText: {
    ...typography.styles.body,
    color: colors.text.muted,
  },
  emissionsStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  emissionsStat: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emissionsStatValue: {
    ...typography.styles.h3,
    color: colors.status.success,
  },
  emissionsStatValueWarning: {
    color: colors.status.error,
  },
  emissionsStatLabel: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  emissionsStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
  },
  monitorsList: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.md,
  },
  monitorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  monitorItemLast: {
    borderBottomWidth: 0,
  },
  monitorName: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  monitorStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  monitorStatusReady: {
    backgroundColor: colors.status.successLight,
  },
  monitorStatusNotReady: {
    backgroundColor: colors.status.errorLight,
  },
  monitorStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monitorStatusText: {
    ...typography.styles.caption,
    fontWeight: typography.fontWeight.medium,
  },
  monitorStatusTextReady: {
    color: colors.status.success,
  },
  monitorStatusTextNotReady: {
    color: colors.status.error,
  },
  additionalInfoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoItemLast: {
    borderBottomWidth: 0,
  },
  infoValueContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  infoValueWithResponse: {
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
  infoValue: {
    ...typography.styles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'right',
  },
  infoResponse: {
    ...typography.styles.caption,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: 2,
    fontSize: 11,
  },
  infoValueSuccess: {
    color: colors.status.success,
  },
  infoValueError: {
    color: colors.status.error,
  },
  actionButtons: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  secondaryAction: {
    marginTop: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerText: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  footerSerial: {
    ...typography.styles.caption,
    color: colors.text.light,
    marginTop: 2,
  },
  clearedCodesNote: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});
