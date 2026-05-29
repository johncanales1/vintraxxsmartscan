// TerminalCallout — rich popup rendered inside a react-native-maps <Callout>
// when a user taps a fleet marker on GpsLiveMapTabScreen.
//
// Mirrors the admin/frontend TerminalInfoCard: Vehicle identity, Location,
// Telemetry, Signal, and Device sections. Rows with null/empty values are
// hidden so the card stays compact.

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import type { GpsTerminal, GpsLocation } from '../types/gps';

// ── Props ────────────────────────────────────────────────────────────────

interface Props {
  terminal: GpsTerminal;
  location: GpsLocation | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function vehicleLabel(t: GpsTerminal): string {
  if (t.nickname) return t.nickname;
  const parts = [t.vehicleYear, t.vehicleMake, t.vehicleModel].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (t.vehicleVin) return t.vehicleVin;
  return t.deviceIdentifier;
}

function fmtRelative(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtVolts(mv: number | null | undefined): string | null {
  if (mv === null || mv === undefined) return null;
  return `${(mv / 1000).toFixed(1)} V`;
}

function fmtMiles(km: number | null | undefined): string | null {
  if (km === null || km === undefined) return null;
  return `${Math.round(km * 0.621371)} mi`;
}

function fmtSpeedMph(kmh: number | null | undefined): string | null {
  if (kmh === null || kmh === undefined) return null;
  return `${Math.round(Number(kmh) * 0.621371)} mph`;
}

function fmtPct(v: number | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return `${Math.round(v)}%`;
}

// ── Sub-components ───────────────────────────────────────────────────────

const Section: React.FC<{
  title: string;
  last?: boolean;
  children: React.ReactNode;
}> = ({ title, last, children }) => (
  <View style={[styles.section, !last && styles.sectionBorder]}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row: React.FC<{
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}> = ({ label, value, mono }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.mono]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

// ── Main component ───────────────────────────────────────────────────────

export const TerminalCallout: React.FC<Props> = ({ terminal, location }) => {
  const isOnline = terminal.status === 'ONLINE';
  const lat = location?.latitude ?? null;
  const lng = location?.longitude ?? null;
  const coordsLabel =
    lat !== null && lng !== null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : null;

  const yearMakeModel = [terminal.vehicleYear, terminal.vehicleMake, terminal.vehicleModel]
    .filter((v) => v !== null && v !== undefined && v !== '')
    .join(' ');

  const parkedSince = isOnline
    ? null
    : terminal.disconnectedAt ?? location?.reportedAt ?? null;

  const cellularCsq = location?.signalStrength ?? null;
  const cellularLabel =
    cellularCsq === null || cellularCsq === undefined
      ? null
      : cellularCsq === 99
        ? 'Unknown'
        : `${cellularCsq}/31`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isOnline ? colors.status.success : '#9CA3AF' },
          ]}
        />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {yearMakeModel || terminal.vehicleVin || terminal.nickname || vehicleLabel(terminal)}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isOnline ? 'Live · Online' : 'Parked · Offline'}
          </Text>
        </View>
      </View>

      {/* Vehicle */}
      <Section title="VEHICLE">
        <Row label="VIN" value={terminal.vehicleVin} mono />
        <Row label="Year / Make / Model" value={yearMakeModel || null} />
        <Row label="Plate #" value={terminal.plateNumber} />
      </Section>

      {/* Location */}
      <Section title="LOCATION">
        <Row label="Coordinates" value={coordsLabel} mono />
        <Row label="Last GPS ping" value={fmtRelative(location?.reportedAt)} />
        {!isOnline && <Row label="Time parked" value={fmtRelative(parkedSince)} />}
        {isOnline && <Row label="Speed" value={fmtSpeedMph(location?.speedKmh)} />}
      </Section>

      {/* Telemetry */}
      <Section title="TELEMETRY">
        <Row label="Vehicle battery" value={fmtVolts(location?.externalVoltageMv)} />
        <Row label="Backup battery" value={fmtVolts(location?.batteryVoltageMv)} />
        <Row label="Odometer" value={fmtMiles(location?.odometerKm)} />
        <Row label="Fuel level" value={fmtPct(location?.fuelLevelPct)} />
      </Section>

      {/* Signal */}
      <Section title="SIGNAL">
        <Row
          label="GPS satellites"
          value={
            location?.satelliteCount !== null && location?.satelliteCount !== undefined
              ? String(location.satelliteCount)
              : null
          }
        />
        <Row label="Cellular (CSQ)" value={cellularLabel} />
      </Section>

      {/* Device */}
      <Section title="DEVICE" last>
        <Row label="IMEI" value={terminal.imei} mono />
        <Row label="Device ID" value={terminal.deviceIdentifier} mono />
      </Section>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap for details →</Text>
      </View>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────

const MONO_FONT = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 6,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 8,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },

  // Sections
  section: {
    marginBottom: 4,
    paddingBottom: 4,
  },
  sectionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.8,
    marginBottom: 3,
  },

  // Rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 1.5,
  },
  rowLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    flexShrink: 0,
    marginRight: 8,
  },
  rowValue: {
    fontSize: 11,
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  mono: {
    fontFamily: MONO_FONT,
    fontSize: 10,
  },

  // Footer
  footer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary.navy,
  },
});
