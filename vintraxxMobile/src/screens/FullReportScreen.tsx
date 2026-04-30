// FullReportScreen for VinTraxx SmartScan
// Submits scan data to backend, polls for AI-processed report, displays merged results
// Combines direct scanned data (clean report) + AI analysis into one unified report
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { apiService } from '../services/api/ApiService';
import { logger, LogCategory } from '../utils/Logger';
import { ScanResult } from '../services/scanner/ScannerService';
import { Vehicle, getVehicleDisplayName, formatMileage } from '../models/Vehicle';
import { ConditionReport } from '../models/ConditionReport';
import { useAppStore } from '../store/appStore';
import { getFuelSystemStatusLabel, getSecondaryAirStatusLabel } from '../services/obd/utils';
import type { FullReportData } from '../types/api';

/**
 * `FullReportScreen` accepts two distinct entry shapes:
 *
 *   • BLE scan flow (the original path) — supplies `scanResult` + `vehicle`
 *     and the screen owns the submit→poll pipeline.
 *   • GPS-DTC AI bridge (Phase 5) — supplies an already-resolved
 *     `prefetchedReport` plus the `scanId` it was polled from. The screen
 *     skips submit/poll and renders directly. We keep `scanResult`+`vehicle`
 *     optional so the type system enforces "one or the other" at the
 *     RootStackParamList layer instead of inside the component body.
 */
interface FullReportScreenProps {
  navigation: any;
  route: {
    params: {
      scanResult?: ScanResult;
      vehicle?: Vehicle;
      conditionReport?: ConditionReport;
      stockNumber?: string;
      additionalRepairs?: string[];
      vehicleOwnerName?: string;
      scannerOwnerName?: string;
      /** Pre-fetched report (AI bridge entry); skips submit/poll when set. */
      prefetchedReport?: FullReportData;
      /** ScanId the prefetched report was polled from (for retry). */
      prefetchedScanId?: string;
    };
  };
}

type ProcessingStatus = 'submitting' | 'processing' | 'completed' | 'failed';

export const FullReportScreen: React.FC<FullReportScreenProps> = ({ navigation, route }) => {
  const {
    scanResult,
    vehicle,
    conditionReport,
    stockNumber,
    additionalRepairs,
    vehicleOwnerName,
    scannerOwnerName,
    prefetchedReport,
    prefetchedScanId,
  } = route.params;
  // When entering via the AI bridge we already have the final report and
  // can short-circuit to the completed state. Otherwise the original BLE
  // flow remains: submit → poll → render.
  const isPrefetched = !!prefetchedReport;
  const [status, setStatus] = useState<ProcessingStatus>(
    isPrefetched ? 'completed' : 'submitting',
  );
  const [statusMessage, setStatusMessage] = useState(
    isPrefetched ? '' : 'Submitting scan data...',
  );
  const [reportData, setReportData] = useState<FullReportData | null>(
    prefetchedReport ?? null,
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [reportSaved, setReportSaved] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isMounted = useRef(true);
  const { updateSavedReport, savedReports, selectedBleDevice, userDevice } = useAppStore();

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  // Pulse animation during processing
  useEffect(() => {
    if (status === 'submitting' || status === 'processing') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    }
  }, [status, pulseAnim]);

  // Update existing report in history when AI report completes (enriches with cost data)
  useEffect(() => {
    if (status === 'completed' && reportData && conditionReport && !reportSaved) {
      const enrichedReport: ConditionReport = {
        ...conditionReport,
        totalRepairCost: reportData.totalEstimatedRepairCost,
        topRepairCost: reportData.repairRecommendations.length > 0
          ? Math.max(...reportData.repairRecommendations.map(r => r.estimatedCost.total))
          : 0,
        otherRepairsCost: reportData.repairRecommendations.length > 1
          ? reportData.repairRecommendations.slice(1).reduce((sum, r) => sum + r.estimatedCost.total, 0)
          : 0,
      };
      // Update the existing report instead of adding a duplicate
      const existingReport = savedReports.find(r => r.id === enrichedReport.id);
      if (existingReport) {
        updateSavedReport(enrichedReport.id, enrichedReport);
        logger.info(LogCategory.APP, 'Existing report updated with AI data', { reportId: enrichedReport.id });
      } else {
        logger.info(LogCategory.APP, 'Report not found in history for update (may not have been saved)', { reportId: enrichedReport.id });
      }
      setReportSaved(true);
    }
  }, [status, reportData, conditionReport, reportSaved, updateSavedReport, savedReports]);

  // Submit and poll pipeline
  useEffect(() => {
    // AI-bridge entry already has the final report — skip submit/poll.
    if (isPrefetched) return;
    // Defensive: BLE entry MUST supply scanResult. Surface a clear error
    // instead of crashing on `payload.codes` access.
    if (!scanResult) {
      logger.error(
        LogCategory.APP,
        'FullReportScreen: missing scanResult and no prefetchedReport',
      );
      setStatus('failed');
      setErrorMessage('Internal error: scan data unavailable.');
      return;
    }
    let cancelled = false;

    const processReport = async () => {
      try {
        // Step 1: Build payload and submit
        const scannerDeviceId = selectedBleDevice?.id || undefined;
        const userFullName = scannerOwnerName || userDevice?.name || undefined;
        const payload = apiService.buildScanPayload(scanResult, stockNumber, additionalRepairs, scannerDeviceId, userFullName, vehicleOwnerName);
        logger.info(LogCategory.APP, 'Submitting scan for full report', {
          stockNumber: stockNumber || undefined,
          additionalRepairs: additionalRepairs || [],
          scannerDeviceId: scannerDeviceId || undefined,
          vehicleOwnerName: vehicleOwnerName || undefined,
        });

        const submitResult = await apiService.submitScan(payload);
        if (cancelled || !isMounted.current) return;

        if (!submitResult.success || !submitResult.scanId) {
          setStatus('failed');
          setErrorMessage(submitResult.message || 'Failed to submit scan.');
          return;
        }

        // Step 2: Poll for report
        setStatus('processing');
        setStatusMessage('Analyzing with AI...');

        const pollResult = await apiService.pollReport(
          submitResult.scanId,
          (pollStatus) => {
            if (cancelled || !isMounted.current) return;
            switch (pollStatus) {
              case 'processing':
                setStatusMessage('AI is analyzing your scan data...');
                break;
              default:
                setStatusMessage(`Processing: ${pollStatus}`);
            }
          },
        );

        if (cancelled || !isMounted.current) return;

        if (pollResult.success && pollResult.data) {
          setReportData(pollResult.data);
          setStatus('completed');
        } else {
          setStatus('failed');
          setErrorMessage(pollResult.message || 'Report processing failed.');
        }
      } catch (error) {
        if (cancelled || !isMounted.current) return;
        logger.error(LogCategory.APP, 'Full report pipeline error', error);
        setStatus('failed');
        setErrorMessage('An unexpected error occurred.');
      }
    };

    processReport();
    return () => { cancelled = true; };
  }, [scanResult, isPrefetched]);

  const handleRetry = () => {
    setErrorMessage('');
    setReportSaved(false);
    if (isPrefetched && prefetchedScanId) {
      // AI-bridge retry — just re-poll the existing scan.
      setStatus('processing');
      setStatusMessage('Re-checking report...');
      void (async () => {
        const pollResult = await apiService.pollReport(prefetchedScanId);
        if (pollResult.success && pollResult.data) {
          setReportData(pollResult.data);
          setStatus('completed');
        } else {
          setStatus('failed');
          setErrorMessage(pollResult.message || 'Report processing failed.');
        }
      })();
      return;
    }
    setStatus('submitting');
    setStatusMessage('Submitting scan data...');
    setReportData(null);
    navigation.replace('FullReport', { scanResult, vehicle, conditionReport });
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Render loading/processing state
  if (status === 'submitting' || status === 'processing') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Animated.View style={[styles.loadingIcon, { transform: [{ scale: pulseAnim }] }]}>
            <ActivityIndicator size="large" color={colors.primary.navy} />
          </Animated.View>
          <Text style={styles.loadingTitle}>
            {status === 'submitting' ? 'Submitting Scan...' : 'Generating Report...'}
          </Text>
          <Text style={styles.loadingSubtitle}>{statusMessage}</Text>
          <Text style={styles.loadingHint}>
            This may take up to 2 minutes. Please don't close the app.
          </Text>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="ghost"
            size="medium"
            style={styles.cancelButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (status === 'failed') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Report Failed</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Button title="Retry" onPress={handleRetry} variant="primary" size="large" style={styles.retryButton} />
          <Button title="Go Back" onPress={() => navigation.goBack()} variant="ghost" size="medium" />
        </View>
      </SafeAreaView>
    );
  }

  // Render completed report
  if (!reportData) return null;

  const report = conditionReport;
  const allCodes = report ? [...report.activeDtcCodes, ...report.pendingDtcCodes] : [];
  const storedCodes = report?.activeDtcCodes || [];
  const pendingCodes = report?.pendingDtcCodes || [];

  // Calculate cost summary
  const totalRepairCost = reportData.totalEstimatedRepairCost;
  const topRepairCost = reportData.repairRecommendations.length > 0
    ? Math.max(...reportData.repairRecommendations.map(r => r.estimatedCost.total))
    : 0;
  const otherRepairsCost = totalRepairCost - topRepairCost;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Report Header */}
        <View style={styles.reportHeader}>
          <Text style={styles.reportTitle}>Full Diagnostic Report</Text>
          <Text style={styles.reportSubtitle}>
            {reportData.vehicle.year} {reportData.vehicle.make} {reportData.vehicle.model}
          </Text>
          <Text style={styles.reportMeta}>
            VIN: {reportData.vehicle.vin} | {reportData.vehicle.mileage ? `${Math.round(reportData.vehicle.mileage).toLocaleString()} mi` : 'N/A'}
          </Text>
          {report && <Text style={styles.reportDate}>{formatDate(report.scanDate)}</Text>}
        </View>

        {/* MIL Status Banner */}
        {report && (
          <View style={[
            styles.milBanner,
            report.celStatus ? styles.milBannerOn : styles.milBannerOff,
          ]}>
            <Text style={styles.milIcon}>{report.celStatus ? '⚠' : '✓'}</Text>
            <View style={styles.milTextWrap}>
              <Text style={styles.milTitle}>
                Check Engine Light: {report.celStatus ? 'ON' : 'OFF'}
              </Text>
              <Text style={styles.milSubtitle}>
                {report.dtcCountFromECU ?? allCodes.length} DTC(s) reported by ECU
              </Text>
            </View>
          </View>
        )}

        {/* Health Score */}
        <View style={styles.healthScoreCard}>
          <View style={[
            styles.healthScoreCircle,
            reportData.overallStatus === 'healthy' ? styles.healthGood :
            reportData.overallStatus === 'attention_needed' ? styles.healthWarning : styles.healthCritical,
          ]}>
            <Text style={styles.healthScoreValue}>{reportData.healthScore}</Text>
            <Text style={styles.healthScoreLabel}>/ 100</Text>
          </View>
          <View style={styles.healthScoreInfo}>
            <Text style={styles.healthStatusText}>
              {reportData.overallStatus === 'healthy' ? 'Healthy' :
               reportData.overallStatus === 'attention_needed' ? 'Attention Needed' : 'Critical'}
            </Text>
            <Text style={styles.healthCostText}>
              Est. Repair: ${totalRepairCost.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Cost Summary */}
        <Section title="Cost Summary">
          <View style={styles.costSummaryRow}>
            <View style={styles.costItem}>
              <Text style={styles.costItemValue}>${totalRepairCost.toLocaleString()}</Text>
              <Text style={styles.costItemLabel}>Total Cost</Text>
            </View>
            <View style={styles.costDivider} />
            <View style={styles.costItem}>
              <Text style={styles.costItemValue}>${topRepairCost.toLocaleString()}</Text>
              <Text style={styles.costItemLabel}>Top Repair</Text>
            </View>
          </View>
          <View style={styles.costSummaryRow}>
            <View style={styles.costItem}>
              <Text style={styles.costItemValue}>${otherRepairsCost.toLocaleString()}</Text>
              <Text style={styles.costItemLabel}>Other Costs</Text>
            </View>
          </View>
        </Section>

        {/* AI Summary */}
        <Section title="AI Summary">
          <Text style={styles.summaryText}>{reportData.aiSummary}</Text>
        </Section>

        {/* Vehicle Information (from scan) */}
        {report && (
          <Section title="Vehicle Information">
            <DataRow label="VIN" value={report.vehicle.vin} />
            <DataRow label="Year / Make / Model" value={getVehicleDisplayName(report.vehicle)} />
            <DataRow label="Mileage" value={formatMileage(report.scanMileage)} />
            {report.odometerEcu && (
              <DataRow label="Odometer ECU" value={report.odometerEcu} isLast />
            )}
          </Section>
        )}

        {/* Stored DTC Codes (from scan) */}
        <Section title="Stored DTC Codes" subtitle={`${storedCodes.length} code(s)`}>
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
        </Section>

        {/* Pending DTC Codes (from scan) */}
        <Section title="Pending DTC Codes" subtitle={`${pendingCodes.length} code(s)`}>
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
        </Section>

        {/* DTC Analysis (from AI) */}
        {reportData.dtcAnalysis.length > 0 && (
          <Section title="AI DTC Analysis" subtitle={`${reportData.dtcAnalysis.length} code(s) analyzed`}>
            {reportData.dtcAnalysis.map((dtc, i) => (
              <View key={i} style={[styles.dtcCard, i < reportData.dtcAnalysis.length - 1 && styles.dtcCardSpaced]}>
                <View style={styles.dtcHeader}>
                  <Text style={styles.dtcCode}>{dtc.code}</Text>
                  <View style={[
                    styles.severityBadge,
                    dtc.severity === 'critical' ? styles.severityCritical :
                    dtc.severity === 'moderate' ? styles.severityModerate : styles.severityMinor,
                  ]}>
                    <Text style={styles.severityText}>{dtc.severity}</Text>
                  </View>
                </View>
                <Text style={styles.dtcDescription}>{dtc.description}</Text>
                <Text style={styles.dtcCategory}>{dtc.category}</Text>
                {dtc.possibleCauses.length > 0 && (
                  <View style={styles.causesContainer}>
                    <Text style={styles.causesTitle}>Possible Causes:</Text>
                    {dtc.possibleCauses.map((cause, j) => (
                      <Text key={j} style={styles.causeItem}>• {cause}</Text>
                    ))}
                  </View>
                )}
                <View style={styles.dtcCostRow}>
                  <Text style={styles.dtcCostLabel}>Repair Estimate:</Text>
                  <Text style={styles.dtcCostValue}>
                    ${dtc.repairEstimate.low.toLocaleString()} – ${dtc.repairEstimate.high.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Repair Recommendations (from AI) */}
        {reportData.repairRecommendations.length > 0 && (
          <Section title="Repair Recommendations">
            {reportData.repairRecommendations.map((rec, i) => (
              <View key={i} style={[styles.repairCard, i < reportData.repairRecommendations.length - 1 && styles.repairCardSpaced]}>
                <View style={styles.repairHeader}>
                  <Text style={styles.repairTitle}>{rec.title}</Text>
                  <View style={[
                    styles.priorityBadge,
                    rec.priority === 'high' ? styles.priorityHigh :
                    rec.priority === 'medium' ? styles.priorityMedium : styles.priorityLow,
                  ]}>
                    <Text style={styles.priorityText}>{rec.priority}</Text>
                  </View>
                </View>
                <Text style={styles.repairDesc}>{rec.description}</Text>
                <View style={styles.repairCosts}>
                  <View style={styles.repairCostsRow}>
                    <Text style={styles.repairCostItem}>Labor: ${rec.estimatedCost.labor.toLocaleString()}</Text>
                    <Text style={styles.repairCostItem}>Parts: ${rec.estimatedCost.parts.toLocaleString()}</Text>
                  </View>
                  <View style={styles.repairTotalRow}>
                    <Text style={styles.repairCostTotal}>Total: ${rec.estimatedCost.total.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Additional Repairs (from AI) */}
        {reportData.additionalRepairs && reportData.additionalRepairs.length > 0 && (
          <Section title="Additional Repairs" subtitle={`${reportData.additionalRepairs.length} item(s)`}>
            {reportData.additionalRepairs.map((repair, i) => (
              <View key={i} style={[styles.repairCard, i < (reportData.additionalRepairs?.length || 0) - 1 && styles.repairCardSpaced]}>
                <Text style={styles.repairTitle}>{repair.name}</Text>
                <Text style={styles.repairDesc}>{repair.description}</Text>
                <View style={styles.repairCosts}>
                  <View style={styles.repairCostsRow}>
                    <Text style={styles.repairCostItem}>Labor ({repair.laborHours}h): ${repair.laborCost.toLocaleString()}</Text>
                    <Text style={styles.repairCostItem}>Parts: ${repair.partsCost.toLocaleString()}</Text>
                  </View>
                  <View style={styles.repairTotalRow}>
                    <Text style={styles.repairCostTotal}>Total: ${repair.totalCost.toLocaleString()}</Text>
                  </View>
                </View>
              </View>
            ))}
            <View style={[styles.costSummaryRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.light, paddingTop: 8 }]}>
              <View style={styles.costItem}>
                <Text style={styles.costItemValue}>${(reportData.additionalRepairsTotalCost || 0).toLocaleString()}</Text>
                <Text style={styles.costItemLabel}>Additional Total</Text>
              </View>
              {reportData.grandTotalCost !== undefined && (
                <>
                  <View style={styles.costDivider} />
                  <View style={styles.costItem}>
                    <Text style={styles.costItemValue}>${reportData.grandTotalCost.toLocaleString()}</Text>
                    <Text style={styles.costItemLabel}>Grand Total</Text>
                  </View>
                </>
              )}
            </View>
          </Section>
        )}

        {/* Scan Data (from scan) */}
        {report && (
          <Section title="Scan Data">
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
              isLast
            />
          </Section>
        )}

        {/* Emissions Analysis (from AI + scan) */}
        <Section title="Emissions Analysis">
          <View style={styles.emissionsRow}>
            <View style={[
              styles.emissionsStatusBadge,
              reportData.emissionsAnalysis.status === 'pass' ? styles.emissionsPass :
              reportData.emissionsAnalysis.status === 'fail' ? styles.emissionsFail : styles.emissionsIncomplete,
            ]}>
              <Text style={styles.emissionsStatusText}>
                {reportData.emissionsAnalysis.status.toUpperCase()}
              </Text>
            </View>
            <View style={styles.emissionsInfo}>
              <Text style={styles.emissionsDetailText}>
                Tests Passed: {reportData.emissionsCheck.testsPassed} | Failed: {reportData.emissionsCheck.testsFailed}
              </Text>
            </View>
          </View>
          <Text style={styles.emissionsSummary}>{reportData.emissionsAnalysis.summary}</Text>
        </Section>

        {/* Emissions Monitor Readiness (from scan) */}
        {report && (
          <Section title="Emissions Monitor Readiness">
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
          </Section>
        )}

        {/* Mileage Risk Assessment (from AI) */}
        {reportData.mileageRiskAssessment.length > 0 && (
          <Section title="Mileage Risk Assessment">
            {reportData.mileageRiskAssessment.map((risk, i) => (
              <View key={i} style={[styles.riskRow, i < reportData.mileageRiskAssessment.length - 1 && styles.riskRowBorder]}>
                <Text style={styles.riskIssue}>{risk.issue}</Text>
                <View style={styles.riskDetails}>
                  <Text style={styles.riskCost}>
                    ${risk.costEstimateLow.toLocaleString()} – ${risk.costEstimateHigh.toLocaleString()}
                  </Text>
                  <Text style={styles.riskMileage}>@ {risk.mileageEstimate.toLocaleString()} mi</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Report Metadata */}
        <Section title="Scan Details">
          <View style={styles.metaGrid}>
            <MetaRow label="Modules Scanned" value={reportData.modulesScanned.join(', ')} />
            <MetaRow label="Datapoints" value={`${reportData.datapointsScanned.toLocaleString()}`} />
            <MetaRow label="Report Version" value={reportData.reportMetadata.reportVersion} />
            <MetaRow label="Generated" value={new Date(reportData.reportMetadata.generatedAt).toLocaleString()} isLast />
          </View>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Report ID: {reportData.reportMetadata.reportId}</Text>
          <Text style={styles.footerText}>Scanned with VinTraxx SmartScan</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Section wrapper
const Section: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <View style={sectionStyles.container}>
    <Text style={sectionStyles.title}>{title}</Text>
    {subtitle && <Text style={sectionStyles.subtitle}>{subtitle}</Text>}
    <View style={sectionStyles.card}>{children}</View>
  </View>
);

const DataRow: React.FC<{ label: string; value: string; isLast?: boolean }> = ({ label, value, isLast }) => (
  <View style={[styles.dataRow, !isLast && styles.dataRowBorder]}>
    <Text style={styles.dataLabel}>{label}</Text>
    <Text style={styles.dataValue}>{value}</Text>
  </View>
);

const MetaRow: React.FC<{ label: string; value: string; isLast?: boolean }> = ({ label, value, isLast }) => (
  <View style={[styles.metaRow, !isLast && styles.metaRowBorder]}>
    <Text style={styles.metaLabel}>{label}</Text>
    <Text style={styles.metaValue} numberOfLines={3}>{value}</Text>
  </View>
);

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.primary.navy,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
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
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary.navy + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    ...typography.styles.h3,
    color: colors.primary.navy,
    marginBottom: spacing.sm,
  },
  loadingSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  loadingHint: {
    ...typography.styles.caption,
    color: colors.text.muted,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: spacing.xl,
  },
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  errorIcon: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.status.error,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.status.errorLight,
    textAlign: 'center',
    lineHeight: 72,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  errorTitle: {
    ...typography.styles.h3,
    color: colors.status.error,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    marginBottom: spacing.sm,
    minWidth: 200,
  },
  // Report
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['4xl'],
  },
  reportHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  reportTitle: {
    ...typography.styles.h3,
    color: colors.primary.navy,
  },
  reportSubtitle: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  reportMeta: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  reportDate: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
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
  milIcon: {
    fontSize: 24,
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
  // Health Score
  healthScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  healthScoreCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  healthGood: { backgroundColor: colors.status.successLight, borderWidth: 3, borderColor: colors.status.success },
  healthWarning: { backgroundColor: colors.status.warningLight, borderWidth: 3, borderColor: colors.status.warning },
  healthCritical: { backgroundColor: colors.status.errorLight, borderWidth: 3, borderColor: colors.status.error },
  healthScoreValue: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  healthScoreLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: -2,
  },
  healthScoreInfo: { flex: 1 },
  healthStatusText: {
    ...typography.styles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  healthCostText: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
  },
  // Cost Summary
  costSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  costItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  costItemValue: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.navy,
    marginBottom: 4,
  },
  costItemLabel: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  costDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
  },
  // Summary
  summaryText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  // Data rows (vehicle info, scan data)
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  dataRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  dataLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    flex: 2,
    paddingRight: spacing.sm,
  },
  dataValue: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 3,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  // Code rows (DTC codes from scan)
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
  // Monitor rows (emissions from scan)
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
  // DTC Analysis
  dtcCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.warning,
  },
  dtcCardSpaced: { marginBottom: spacing.sm },
  dtcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dtcCode: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary.navy,
  },
  severityBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  severityCritical: { backgroundColor: colors.status.errorLight },
  severityModerate: { backgroundColor: colors.status.warningLight },
  severityMinor: { backgroundColor: colors.status.infoLight },
  severityText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semiBold,
    textTransform: 'uppercase',
  },
  dtcDescription: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginBottom: 2,
  },
  dtcCategory: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginBottom: spacing.sm,
  },
  causesContainer: { marginBottom: spacing.sm },
  causesTitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: 2,
  },
  causeItem: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  dtcCostRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  dtcCostLabel: { ...typography.styles.caption, color: colors.text.muted },
  dtcCostValue: { ...typography.styles.caption, color: colors.primary.navy, fontWeight: typography.fontWeight.semiBold },
  // Repair Recommendations
  repairCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.md,
  },
  repairCardSpaced: { marginBottom: spacing.sm },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  repairTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  priorityBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  priorityHigh: { backgroundColor: colors.status.errorLight },
  priorityMedium: { backgroundColor: colors.status.warningLight },
  priorityLow: { backgroundColor: colors.status.infoLight },
  priorityText: { fontSize: 11, fontWeight: typography.fontWeight.semiBold, textTransform: 'uppercase' },
  repairDesc: { ...typography.styles.caption, color: colors.text.secondary, marginBottom: spacing.sm },
  repairCosts: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  repairCostsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  repairTotalRow: {
    alignItems: 'flex-end',
  },
  repairCostItem: {
    ...typography.styles.caption,
    color: colors.text.muted,
    flexShrink: 1,
  },
  repairCostTotal: {
    ...typography.styles.caption,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
    fontSize: typography.fontSize.sm,
  },
  // Emissions
  emissionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  emissionsStatusBadge: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emissionsPass: { backgroundColor: colors.status.successLight },
  emissionsFail: { backgroundColor: colors.status.errorLight },
  emissionsIncomplete: { backgroundColor: colors.status.warningLight },
  emissionsStatusText: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
  },
  emissionsInfo: { flex: 1 },
  emissionsDetailText: { ...typography.styles.caption, color: colors.text.secondary },
  emissionsSummary: {
    ...typography.styles.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  // Mileage Risk
  riskRow: {
    paddingVertical: spacing.sm,
  },
  riskRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  riskIssue: {
    fontSize: 14,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 4,
  },
  riskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskCost: { ...typography.styles.caption, color: colors.primary.navy, fontWeight: typography.fontWeight.medium },
  riskMileage: { ...typography.styles.caption, color: colors.text.muted },
  // Metadata
  metaGrid: {},
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  metaRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border.light },
  metaLabel: { ...typography.styles.caption, color: colors.text.secondary, flex: 1 },
  metaValue: { ...typography.styles.caption, color: colors.text.primary, fontWeight: typography.fontWeight.medium, flex: 2, textAlign: 'right' },
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
