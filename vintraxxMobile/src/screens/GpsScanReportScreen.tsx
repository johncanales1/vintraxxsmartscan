// GpsScanReportScreen — mobile-side counterpart to the dashboard's
// GpsScanReportPanel.
//
// Single source of truth for the D450 Full Scan Report:
//   • Top KPI tiles (MIL state, DTC count, distance w/ MIL, warm-ups)
//   • DTC bucket chips
//   • OBD live grid (RPM, speed, temps, battery, fuel-system, secondary-air…)
//
// Two CTAs:
//   • Run / Refresh   — POST /gps/terminals/:id/scan, then poll until
//                       status leaves PENDING (≤ 30 s, backend-enforced).
//   • View Full Report — POST /gps/scan-reports/:id/promote-ai; navigates to
//                        the existing FullReportScreen via apiService.pollReport.
//
// Same screen shell + visual hierarchy the BLE scan flow already uses on
// FullReportScreen, so the user experience is identical regardless of
// whether the diagnostic came from a BLE scanner or an LTE GPS scanner.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  NativeStackNavigationProp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { gpsApi } from '../services/gps/GpsApiService';
import { apiService } from '../services/api/ApiService';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';
import type { GpsScanReport } from '../types/gps';
import { GpsScanReportBody } from '../components/gps/GpsScanReportBody';

type ScanRoute = RouteProp<RootStackParamList, 'GpsScanReport'>;

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 25;

export const GpsScanReportScreen: React.FC = () => {
  const route = useRoute<ScanRoute>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { terminalId } = route.params;

  const [report, setReport] = useState<GpsScanReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  // Stable poll: returns when status leaves PENDING or we hit the budget.
  const pollUntilSettled = useCallback(
    async (scanReportId: string): Promise<GpsScanReport | null> => {
      for (let i = 0; i < POLL_MAX_ATTEMPTS; i += 1) {
        if (cancelledRef.current) return null;
        await sleep(POLL_INTERVAL_MS);
        if (cancelledRef.current) return null;
        const res = await gpsApi.getGpsScanReport(scanReportId);
        if (!res.success || !res.data) continue;
        const next = res.data.report;
        if (cancelledRef.current) return null;
        setReport(next);
        if (next.status !== 'PENDING') {
          setScanning(false);
          if (next.status !== 'COMPLETED' && next.status !== 'PARTIAL') {
            setErrorText(next.errorText ?? `Scan ${next.status.toLowerCase()}`);
          }
          return next;
        }
      }
      setScanning(false);
      setErrorText('Scan timed out — please try again.');
      return null;
    },
    [],
  );

  const loadLatest = useCallback(async () => {
    setErrorText(null);
    const res = await gpsApi.listGpsScanReports(terminalId, { limit: 1 });
    if (cancelledRef.current) return;
    if (!res.success) {
      setErrorText(res.message ?? 'Could not load scan history');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const first = res.data?.reports?.[0] ?? null;
    setReport(first);
    if (first?.status === 'PENDING') {
      setScanning(true);
      void pollUntilSettled(first.id);
    }
    setLoading(false);
    setRefreshing(false);
  }, [terminalId, pollUntilSettled]);

  // Initial fetch.
  useEffect(() => {
    cancelledRef.current = false;
    void loadLatest();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadLatest]);

  const onRunScan = async () => {
    setErrorText(null);
    setScanning(true);
    const res = await gpsApi.requestGpsScan(terminalId);
    if (!res.success || !res.data) {
      setScanning(false);
      setErrorText(res.message ?? 'Failed to start scan');
      return;
    }
    // Optimistic shell — replaced by the first poll tick.
    const shell = await gpsApi.getGpsScanReport(res.data.scanReportId);
    if (shell.success && shell.data) setReport(shell.data.report);
    await pollUntilSettled(res.data.scanReportId);
  };

  const onPromoteAi = async () => {
    if (!report || (report.status !== 'COMPLETED' && report.status !== 'PARTIAL')) return;
    setAiBusy(true);
    try {
      let scanId = report.promotedScanId;
      if (!scanId) {
        const res = await gpsApi.promoteGpsScanToAi(report.id);
        if (!res.success || !res.data) {
          Alert.alert(
            'Could not start AI report',
            res.message ?? 'The server rejected the request.',
          );
          return;
        }
        scanId = res.data.scanId;
        setReport((prev) => (prev ? { ...prev, promotedScanId: scanId! } : prev));
      }

      logger.info(LogCategory.APP, '[GpsScanReport] promoting to AI', {
        scanReportId: report.id,
        scanId,
      });

      const pollRes = await apiService.pollReport(scanId);
      if (!pollRes.success || !pollRes.data) {
        Alert.alert(
          'AI report failed',
          pollRes.message ?? 'The report could not be generated.',
        );
        return;
      }
      navigation.navigate('FullReport', {
        prefetchedReport: pollRes.data,
        prefetchedScanId: scanId,
      });
    } finally {
      setAiBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadLatest();
          }}
          tintColor={colors.primary.navy}
        />
      }
    >
      <Text style={styles.title}>Full Scan Report</Text>
      <Text style={styles.subtitle}>
        One-tap diagnostic over the LTE link. Same data the BLE scanner captures,
        no cable needed.
      </Text>

      {/* Primary CTA */}
      <TouchableOpacity
        style={[styles.primaryBtn, scanning && styles.primaryBtnDisabled]}
        onPress={onRunScan}
        disabled={scanning}
        activeOpacity={0.85}
      >
        {scanning ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryBtnText}>
            {report ? 'Refresh scan' : 'Run full scan'}
          </Text>
        )}
      </TouchableOpacity>

      {errorText && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorText}</Text>
        </View>
      )}

      {!report && !scanning && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No scan reports yet</Text>
          <Text style={styles.emptyBody}>
            Tap “Run full scan” to query the ECU and capture a fresh report.
          </Text>
        </View>
      )}

      {report && <GpsScanReportBody report={report} />}

      {(report?.status === 'COMPLETED' || report?.status === 'PARTIAL') && (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.accentBtn, aiBusy && styles.btnDisabled]}
            onPress={onPromoteAi}
            disabled={aiBusy}
            activeOpacity={0.85}
          >
            <Text style={styles.accentBtnText}>
              {aiBusy ? 'Working…' : 'View Full Report'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  title: {
    ...typography.styles.h2,
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    color: '#92400E',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptyBody: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  accentBtn: {
    flex: 1,
    backgroundColor: colors.primary.red,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  accentBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  btnDisabled: { opacity: 0.6 },
} as const);
