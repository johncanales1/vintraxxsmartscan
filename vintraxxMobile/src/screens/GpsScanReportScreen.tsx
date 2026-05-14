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

      {report && <ReportBody report={report} />}

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

// ── Body ────────────────────────────────────────────────────────────────

const ReportBody: React.FC<{ report: GpsScanReport }> = ({ report }) => {
  if (report.status === 'PENDING') {
    return (
      <View style={styles.statusBanner}>
        <ActivityIndicator color={colors.primary.navy} />
        <View style={{ marginLeft: spacing.sm }}>
          <Text style={styles.statusBannerTitle}>Scan in progress…</Text>
          <Text style={styles.statusBannerBody}>
            Querying the ECU. This usually takes 5–15 seconds.
          </Text>
        </View>
      </View>
    );
  }
  if (report.status === 'PARTIAL') {
    return (
      <View>
        <View style={[styles.statusBanner, styles.statusBannerPartial]}>
          <Text style={styles.statusBannerTitle}>Partial scan</Text>
          <Text style={styles.statusBannerBody}>
            Some data was received but the scan did not fully complete. The
            results below may be incomplete.
          </Text>
        </View>
        <KpiGrid report={report} />
        <DtcSection report={report} />
        <ObdGrid report={report} />
      </View>
    );
  }
  if (report.status !== 'COMPLETED') {
    return (
      <View style={[styles.statusBanner, styles.statusBannerWarn]}>
        <Text style={styles.statusBannerTitle}>
          Scan {report.status === 'TIMED_OUT' ? 'timed out' : 'failed'}
        </Text>
        <Text style={styles.statusBannerBody}>
          {report.errorText ??
            "We couldn't reach the device. Make sure ignition is on and the LTE link is connected, then try again."}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <KpiGrid report={report} />
      <DtcSection report={report} />
      <ObdGrid report={report} />
    </View>
  );
};

const KpiGrid: React.FC<{ report: GpsScanReport }> = ({ report }) => {
  const tiles: Array<{
    label: string;
    value: string;
    tone?: 'amber' | 'green';
  }> = [
    {
      label: 'Check Engine',
      value:
        report.milOn === true
          ? 'ON'
          : report.milOn === false
            ? 'OFF'
            : '—',
      tone: report.milOn === true ? 'amber' : 'green',
    },
    {
      label: 'Stored DTCs',
      value: report.dtcCount != null ? String(report.dtcCount) : '—',
      tone: (report.dtcCount ?? 0) > 0 ? 'amber' : 'green',
    },
    {
      label: 'Dist w/ MIL',
      value: formatMiles(report.distanceWithMilKm),
    },
    {
      label: 'Warm-ups',
      value:
        report.warmupsSinceClear != null
          ? String(report.warmupsSinceClear)
          : '—',
    },
  ];
  return (
    <View style={styles.kpiGrid}>
      {tiles.map((t) => (
        <View
          key={t.label}
          style={[
            styles.kpiTile,
            t.tone === 'amber' && styles.kpiTileAmber,
            t.tone === 'green' && styles.kpiTileGreen,
          ]}
        >
          <Text style={styles.kpiLabel}>{t.label}</Text>
          <Text
            style={[
              styles.kpiValue,
              t.tone === 'amber' && styles.kpiValueAmber,
              t.tone === 'green' && styles.kpiValueGreen,
            ]}
          >
            {t.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

const DtcSection: React.FC<{ report: GpsScanReport }> = ({ report }) => {
  const buckets = [
    { name: 'Stored', codes: report.storedDtcCodes },
    { name: 'Pending', codes: report.pendingDtcCodes },
    { name: 'Permanent', codes: report.permanentDtcCodes },
  ].filter((b) => b.codes.length > 0);

  if (buckets.length === 0) {
    return (
      <View style={styles.cleanCard}>
        <Text style={styles.cleanTitle}>No fault codes</Text>
        <Text style={styles.cleanBody}>
          The ECU reported no stored, pending, or permanent codes
          {report.protocol ? ` (${report.protocol}).` : '.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Diagnostic Trouble Codes</Text>
      {buckets.map((b) => (
        <View key={b.name} style={{ marginTop: spacing.sm }}>
          <Text style={styles.bucketTitle}>{b.name}</Text>
          <View style={styles.chipRow}>
            {b.codes.map((c) => (
              <View key={c} style={styles.dtcChip}>
                <Text style={styles.dtcChipText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const ObdGrid: React.FC<{ report: GpsScanReport }> = ({ report }) => {
  const rows: Array<[string, string, boolean?]> = [
    ['VIN', report.vin ?? '—'],
    ['MIL Status', report.milOn === true ? 'ON' : report.milOn === false ? 'OFF' : '—'],
    ['DTC Count', report.dtcCount != null ? String(report.dtcCount) : '—'],
    [
      'Stored DTC Codes',
      report.storedDtcCodes?.length > 0 ? report.storedDtcCodes.join(', ') : '—',
    ],
    [
      'Pending DTC Codes',
      report.pendingDtcCodes?.length > 0 ? report.pendingDtcCodes.join(', ') : '—',
    ],
    [
      'Permanent DTC Codes',
      report.permanentDtcCodes?.length > 0 ? report.permanentDtcCodes.join(', ') : '—',
    ],
    ['Distance with MIL On', formatMiles(report.distanceWithMilKm)],
    ['Engine RPM', report.rpm != null ? `${report.rpm} rpm` : '—'],
    [
      'Vehicle speed',
      report.vehicleSpeedKmh != null
        ? `${Math.round(Number(report.vehicleSpeedKmh) * 0.621371)} mph`
        : '—',
    ],
    ['Coolant Temp', formatTemp(report.coolantTempC)],
    ['Intake Air Temp', formatTemp(report.intakeAirTempC)],
    ['Ambient Temp', formatTemp(report.ambientTempC)],
    ['Engine Load', formatPct(report.engineLoadPct)],
    ['Throttle Position', formatPct(report.throttlePct)],
    ['MAF (Mass Air Flow)', report.mafGps != null ? `${report.mafGps} g/s` : '—'],
    ['Fuel Level', formatPct(report.fuelLevelPct)],
    [
      'Battery Voltage',
      report.batteryVoltageMv != null
        ? `${(report.batteryVoltageMv / 1000).toFixed(1)} V`
        : '—',
    ],
    [
      'Timing Advance',
      (report as any).rawObdJson?.obdLive?.timingAdvanceDeg != null
        ? `${(report as any).rawObdJson.obdLive.timingAdvanceDeg}°`
        : '—',
    ],
    ['Intake Manifold Pressure', report.intakeManifoldKpa != null ? `${report.intakeManifoldKpa} kPa` : '—'],
    [
      'Long Term Fuel Trim',
      (report as any).rawObdJson?.obdLive?.longTermFuelTrimPct != null
        ? `${(report as any).rawObdJson.obdLive.longTermFuelTrimPct}%`
        : '—',
    ],
    [
      'Runtime Since Start',
      report.runtimeSinceStartSec != null ? `${report.runtimeSinceStartSec} s` : '—',
    ],
    ['Barometric Pressure', report.barometricKpa != null ? `${report.barometricKpa} kPa` : '—'],
    ['Accelerator Position', formatPct(report.acceleratorPct)],
    ['Fuel System Status', report.fuelSystemStatus ?? '—'],
    ['Secondary Air Status', report.secondaryAirStatus ?? '—'],
    ['Distance Since Clear', formatMiles(report.distanceSinceClearKm)],
    ['Warm-ups Since Clear', report.warmupsSinceClear != null ? String(report.warmupsSinceClear) : '—'],
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>OBD Live Data</Text>
      {rows.map(([label, value, unsupported]) => (
        <View key={label} style={styles.obdRow}>
          <Text style={styles.obdLabel}>
            {label}
            {unsupported && <Text style={styles.obdLabelUnsupported}> (N/A)</Text>}
          </Text>
          <Text style={[styles.obdValue, unsupported && styles.obdValueUnsupported]}>
            {value}
          </Text>
        </View>
      ))}
      <Text style={styles.obdNote}>
        GPS scanner supports live OBD telemetry; some BLE diagnostic fields may be unavailable unless supported by D450 firmware/protocol.
      </Text>
    </View>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function formatMiles(km: string | number | null | undefined): string {
  if (km === null || km === undefined) return '—';
  const numeric = typeof km === 'number' ? km : Number(km);
  if (!Number.isFinite(numeric)) return '—';
  return `${Math.round(numeric * 0.621371).toLocaleString()} mi`;
}
function formatTemp(c: number | null): string {
  return c != null ? `${c} °C` : '—';
}
function formatPct(p: string | number | null): string {
  if (p === null || p === undefined) return '—';
  const numeric = typeof p === 'number' ? p : Number(p);
  if (!Number.isFinite(numeric)) return '—';
  return `${numeric.toFixed(1)}%`;
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  statusBannerWarn: {
    backgroundColor: '#FEF3C7',
  },
  statusBannerPartial: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  statusBannerTitle: {
    color: colors.primary.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  statusBannerBody: {
    color: colors.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  kpiTile: {
    width: '48%',
    backgroundColor: colors.background.secondary,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  kpiTileAmber: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  kpiTileGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 4,
  },
  kpiValueAmber: { color: '#92400E' },
  kpiValueGreen: { color: '#065F46' },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  bucketTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dtcChip: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  dtcChipText: {
    color: '#991B1B',
    fontFamily: 'Menlo',
    fontWeight: '700',
    fontSize: 12,
  },
  cleanCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cleanTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  cleanBody: {
    color: '#065F46',
    fontSize: 12,
  },
  obdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  obdLabel: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  obdLabelUnsupported: {
    color: colors.text.muted,
    fontSize: 10,
  },
  obdValue: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  obdValueUnsupported: {
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  obdNote: {
    color: colors.text.muted,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: spacing.sm,
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
