// FullReportScreen for VinTraxx SmartScan
// Submits scan data to backend, polls for AI-processed report, displays results
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
import { Vehicle } from '../models/Vehicle';
import type { FullReportData } from '../types/api';

interface FullReportScreenProps {
  navigation: any;
  route: {
    params: {
      scanResult: ScanResult;
      vehicle: Vehicle;
    };
  };
}

type ProcessingStatus = 'submitting' | 'processing' | 'completed' | 'failed';

export const FullReportScreen: React.FC<FullReportScreenProps> = ({ navigation, route }) => {
  const { scanResult, vehicle } = route.params;
  const [status, setStatus] = useState<ProcessingStatus>('submitting');
  const [statusMessage, setStatusMessage] = useState('Submitting scan data...');
  const [reportData, setReportData] = useState<FullReportData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isMounted = useRef(true);

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

  // Submit and poll pipeline
  useEffect(() => {
    let cancelled = false;

    const processReport = async () => {
      try {
        // Step 1: Build payload and submit
        const payload = apiService.buildScanPayload(scanResult);
        logger.info(LogCategory.APP, 'Submitting scan for full report');

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
  }, [scanResult]);

  const handleRetry = () => {
    setStatus('submitting');
    setStatusMessage('Submitting scan data...');
    setErrorMessage('');
    setReportData(null);
    // Re-trigger by navigating to self
    navigation.replace('FullReport', { scanResult, vehicle });
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
            VIN: {reportData.vehicle.vin} | {reportData.vehicle.mileage ? `${reportData.vehicle.mileage.toLocaleString()} mi` : 'N/A'}
          </Text>
        </View>

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
              Est. Repair: ${reportData.totalEstimatedRepairCost.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* AI Summary */}
        <Section title="AI Summary">
          <Text style={styles.summaryText}>{reportData.aiSummary}</Text>
        </Section>

        {/* DTC Analysis */}
        {reportData.dtcAnalysis.length > 0 && (
          <Section title="DTC Analysis" subtitle={`${reportData.dtcAnalysis.length} code(s) analyzed`}>
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
                      <Text key={j} style={styles.causeItem}>- {cause}</Text>
                    ))}
                  </View>
                )}
                <View style={styles.dtcCostRow}>
                  <Text style={styles.dtcCostLabel}>Repair Estimate:</Text>
                  <Text style={styles.dtcCostValue}>
                    ${dtc.repairEstimate.low.toLocaleString()} - ${dtc.repairEstimate.high.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Repair Recommendations */}
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
                  <Text style={styles.repairCostItem}>Labor: ${rec.estimatedCost.labor.toLocaleString()}</Text>
                  <Text style={styles.repairCostItem}>Parts: ${rec.estimatedCost.parts.toLocaleString()}</Text>
                  <Text style={styles.repairCostTotal}>Total: ${rec.estimatedCost.total.toLocaleString()}</Text>
                </View>
              </View>
            ))}
          </Section>
        )}

        {/* Emissions Analysis */}
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

        {/* Mileage Risk Assessment */}
        {reportData.mileageRiskAssessment.length > 0 && (
          <Section title="Mileage Risk Assessment">
            {reportData.mileageRiskAssessment.map((risk, i) => (
              <View key={i} style={[styles.riskRow, i < reportData.mileageRiskAssessment.length - 1 && styles.riskRowBorder]}>
                <Text style={styles.riskIssue}>{risk.issue}</Text>
                <View style={styles.riskDetails}>
                  <Text style={styles.riskCost}>
                    ${risk.costEstimateLow.toLocaleString()} - ${risk.costEstimateHigh.toLocaleString()}
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  healthGood: { backgroundColor: colors.status.successLight, borderWidth: 3, borderColor: colors.status.success },
  healthWarning: { backgroundColor: colors.status.warningLight, borderWidth: 3, borderColor: colors.status.warning },
  healthCritical: { backgroundColor: colors.status.errorLight, borderWidth: 3, borderColor: colors.status.error },
  healthScoreValue: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  healthScoreLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: -4,
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
  // Summary
  summaryText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    lineHeight: 22,
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
    flexDirection: 'row',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  repairCostItem: { ...typography.styles.caption, color: colors.text.muted },
  repairCostTotal: { ...typography.styles.caption, color: colors.primary.navy, fontWeight: typography.fontWeight.semiBold },
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
