// GpsTerminalDetailScreen — detail view for a single GPS terminal.
//
// Shows terminal info and 3 action buttons:
//   • Run Full Scan
//   • View Full Report
//   • Email Report

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { gpsApi } from '../../services/gps/GpsApiService';
import { logger, LogCategory } from '../../utils/Logger';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';
import type { GpsTerminal } from '../../types/gps';
import { useAppStore } from '../../store/appStore';

import CarIcon from '../../assets/icons/car.svg';

type DetailRoute = RouteProp<RootStackParamList, 'GpsTerminalDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  ONLINE:          { color: '#16A34A', label: 'Online',          bg: '#DCFCE7' },
  OFFLINE:         { color: '#DC2626', label: 'Offline',         bg: '#FEE2E2' },
  NEVER_CONNECTED: { color: '#9CA3AF', label: 'Never Connected', bg: '#F3F4F6' },
  REVOKED:         { color: '#6B7280', label: 'Revoked',         bg: '#F3F4F6' },
};

function vehicleLabel(t: GpsTerminal): string {
  if (t.nickname) return t.nickname;
  const parts = [t.vehicleYear, t.vehicleMake, t.vehicleModel].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (t.vehicleVin) return t.vehicleVin;
  return t.deviceIdentifier;
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const GpsTerminalDetailScreen: React.FC = () => {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { terminalId } = route.params;

  const terminal = useAppStore((s) => s.gpsTerminals.find((t) => t.id === terminalId));
  const [scanning, setScanning] = useState(false);
  const [emailing, setEmailing] = useState(false);

  if (!terminal) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
        <Text style={styles.loadingText}>Loading terminal...</Text>
      </SafeAreaView>
    );
  }

  const status = STATUS_CONFIG[terminal.status] ?? STATUS_CONFIG.OFFLINE;

  const handleRunScan = async () => {
    setScanning(true);
    try {
      logger.info(LogCategory.GPS, `Requesting full scan for terminal ${terminalId}`);
      const result = await gpsApi.requestGpsScan(terminalId);
      if (result.success && result.data) {
        Alert.alert(
          'Scan Requested',
          'A full OBD scan has been requested. This may take a few minutes. Check back in the History tab.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to request scan.');
      }
    } catch (error) {
      logger.error(LogCategory.GPS, 'Failed to request scan', error);
      Alert.alert('Error', 'Failed to request scan. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const handleViewReport = () => {
    navigation.navigate('GpsScanReport', { terminalId });
  };

  const handleEmail = async () => {
    setEmailing(true);
    try {
      logger.info(LogCategory.GPS, `Listing scan reports for terminal ${terminalId}`);
      const listResult = await gpsApi.listGpsScanReports(terminalId, { limit: 1 });
      if (listResult.success && listResult.data) {
        const reports = (listResult.data as any).reports ?? [];
        if (reports.length === 0) {
          Alert.alert('No Reports', 'No scan reports available to email. Run a full scan first.');
          return;
        }
        const latestReport = reports[0];
        const emailResult = await gpsApi.emailGpsScanReport(latestReport.id);
        if (emailResult.success) {
          Alert.alert('Email Sent', `Report emailed successfully.`);
        } else {
          Alert.alert('Error', emailResult.message || 'Failed to send email.');
        }
      }
    } catch (error) {
      logger.error(LogCategory.GPS, 'Failed to email report', error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    } finally {
      setEmailing(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Terminal Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoIconWrap}>
            <CarIcon width={28} height={28} color="#FFFFFF" />
          </View>
          <View style={styles.infoHeaderText}>
            <Text style={styles.infoTitle}>{vehicleLabel(terminal)}</Text>
            <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDotSmall, { backgroundColor: status.color }]} />
              <Text style={[styles.statusPillText, { color: status.color }]}>
                {status.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoRow label="Device ID" value={terminal.deviceIdentifier} />
          {terminal.vehicleVin && <InfoRow label="VIN" value={terminal.vehicleVin} mono />}
          {terminal.imei && <InfoRow label="IMEI" value={terminal.imei} mono />}
          <InfoRow label="Last Seen" value={formatRelative(terminal.lastHeartbeatAt)} />
          {terminal.vehicleYear && (
            <InfoRow
              label="Vehicle"
              value={`${terminal.vehicleYear} ${terminal.vehicleMake ?? ''} ${terminal.vehicleModel ?? ''}`.trim()}
            />
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <Text style={styles.actionsTitle}>Actions</Text>

      <TouchableOpacity
        style={[styles.actionButton, styles.actionPrimary]}
        onPress={handleRunScan}
        disabled={scanning}
        activeOpacity={0.8}
      >
        {scanning ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.actionIcon}>⚡</Text>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionButtonText}>Run Full Scan</Text>
              <Text style={styles.actionButtonSub}>Request a remote OBD diagnostic scan</Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.actionSecondary]}
        onPress={handleViewReport}
        activeOpacity={0.8}
      >
        <Text style={styles.actionIcon}>📊</Text>
        <View style={styles.actionTextWrap}>
          <Text style={[styles.actionButtonText, { color: colors.primary.navy }]}>
            View Full Report
          </Text>
          <Text style={styles.actionButtonSubDark}>
            View scan history and detailed reports
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.actionSecondary]}
        onPress={handleEmail}
        disabled={emailing}
        activeOpacity={0.8}
      >
        {emailing ? (
          <ActivityIndicator color={colors.primary.navy} size="small" />
        ) : (
          <>
            <Text style={styles.actionIcon}>✉️</Text>
            <View style={styles.actionTextWrap}>
              <Text style={[styles.actionButtonText, { color: colors.primary.navy }]}>
                Email Report
              </Text>
              <Text style={styles.actionButtonSubDark}>
                Send the latest scan report via email
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ── Info Row ───────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[
        styles.infoValue,
        mono && { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12 },
      ]}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  infoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoHeaderText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoGrid: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.text.muted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  actionPrimary: {
    backgroundColor: colors.primary.navy,
  },
  actionSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionButtonSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  actionButtonSubDark: {
    fontSize: 12,
    color: colors.text.muted,
  },
});
