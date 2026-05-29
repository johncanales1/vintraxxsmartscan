// GpsScanReportBody — shared renderer for a D450 GPS full-scan report.
//
// Extracted from GpsScanReportScreen so both the standalone report screen and
// the inline Terminal Detail flow render identical KPI tiles, DTC buckets, and
// the OBD live-data grid. Pure presentational: pass a GpsScanReport and it
// renders the status-aware body.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { GpsScanReport } from '../../types/gps';

export const GpsScanReportBody: React.FC<{ report: GpsScanReport }> = ({ report }) => {
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

export function formatMiles(km: string | number | null | undefined): string {
  if (km === null || km === undefined) return '—';
  const numeric = typeof km === 'number' ? km : Number(km);
  if (!Number.isFinite(numeric)) return '—';
  return `${Math.round(numeric * 0.621371).toLocaleString()} mi`;
}
export function formatTemp(c: number | null): string {
  return c != null ? `${c} °C` : '—';
}
export function formatPct(p: string | number | null): string {
  if (p === null || p === undefined) return '—';
  const numeric = typeof p === 'number' ? p : Number(p);
  if (!Number.isFinite(numeric)) return '—';
  return `${numeric.toFixed(1)}%`;
}

// ── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
});
