// GpsTerminalDetailScreen — detail view for a single GPS terminal.
//
// Progressive Actions flow (inline):
//   1. Only "Run Full Scan" is shown.
//   2. After a scan completes, the scanned OBD data is rendered inline and
//      "View Full Report" appears.
//   3. "View Full Report" generates the AI report, opens it, and reveals
//      "Email Report".
//   4. "Email Report" sends the PDF to an editable address (defaults to the
//      logged-in user's email).

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { gpsApi } from '../../services/gps/GpsApiService';
import { apiService } from '../../services/api/ApiService';
import { logger, LogCategory } from '../../utils/Logger';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';
import type { GpsTerminal, GpsScanReport } from '../../types/gps';
import { useAppStore } from '../../store/appStore';
import { GpsScanReportBody } from '../../components/gps/GpsScanReportBody';

import CarIcon from '../../assets/icons/car.svg';

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 25;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

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
  const user = useAppStore((s) => s.user);

  const [report, setReport] = useState<GpsScanReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailValue, setEmailValue] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const cancelledRef = useRef(false);

  // Poll a scan report until it leaves PENDING (or the budget is exhausted).
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

  // Load the most recent scan report so an already-scanned terminal lands in
  // the right progressive state on entry.
  const loadLatest = useCallback(async () => {
    const res = await gpsApi.listGpsScanReports(terminalId, { limit: 1 });
    if (cancelledRef.current) return;
    if (res.success) {
      const first = res.data?.reports?.[0] ?? null;
      setReport(first);
      if (first?.promotedScanId) setAiGenerated(true);
      if (first?.status === 'PENDING') {
        setScanning(true);
        void pollUntilSettled(first.id);
      }
    }
    setLoadingReport(false);
  }, [terminalId, pollUntilSettled]);

  useEffect(() => {
    cancelledRef.current = false;
    void loadLatest();
    return () => {
      cancelledRef.current = true;
    };
  }, [loadLatest]);

  if (!terminal) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
        <Text style={styles.loadingText}>Loading terminal...</Text>
      </View>
    );
  }

  const status = STATUS_CONFIG[terminal.status] ?? STATUS_CONFIG.OFFLINE;

  const handleRunScan = async () => {
    setErrorText(null);
    // A fresh scan invalidates any previously-generated AI report, so hide the
    // Email Report step until the new report is promoted again.
    setAiGenerated(false);
    setScanning(true);
    try {
      logger.info(LogCategory.GPS, `Requesting full scan for terminal ${terminalId}`);
      const res = await gpsApi.requestGpsScan(terminalId);
      if (!res.success || !res.data) {
        setScanning(false);
        setErrorText(res.message || 'Failed to request scan.');
        return;
      }
      // Optimistic shell — replaced by the first poll tick.
      const shell = await gpsApi.getGpsScanReport(res.data.scanReportId);
      if (shell.success && shell.data) setReport(shell.data.report);
      await pollUntilSettled(res.data.scanReportId);
    } catch (error) {
      logger.error(LogCategory.GPS, 'Failed to request scan', error);
      setScanning(false);
      setErrorText('Failed to request scan. Please try again.');
    }
  };

  // Generate the AI report from the scanned data, open it, and unlock email.
  const handleViewReport = async () => {
    if (!report || (report.status !== 'COMPLETED' && report.status !== 'PARTIAL')) return;
    setAiBusy(true);
    try {
      let scanId = report.promotedScanId;
      if (!scanId) {
        const res = await gpsApi.promoteGpsScanToAi(report.id);
        if (!res.success || !res.data) {
          Alert.alert('Could not start AI report', res.message ?? 'The server rejected the request.');
          return;
        }
        scanId = res.data.scanId;
        setReport((prev) => (prev ? { ...prev, promotedScanId: scanId! } : prev));
      }
      logger.info(LogCategory.GPS, '[GpsTerminalDetail] promoting to AI', {
        scanReportId: report.id,
        scanId,
      });
      const pollRes = await apiService.pollReport(scanId);
      if (!pollRes.success || !pollRes.data) {
        Alert.alert('AI report failed', pollRes.message ?? 'The report could not be generated.');
        return;
      }
      setAiGenerated(true);
      navigation.navigate('FullReport', {
        prefetchedReport: pollRes.data,
        prefetchedScanId: scanId,
      });
    } finally {
      setAiBusy(false);
    }
  };

  const openEmailModal = () => {
    setEmailValue(user?.email ?? '');
    setEmailModalVisible(true);
  };

  const handleSendEmail = async () => {
    if (!report) return;
    const target = emailValue.trim();
    setEmailing(true);
    try {
      logger.info(LogCategory.GPS, `Emailing scan report ${report.id}`, { to: target });
      const res = await gpsApi.emailGpsScanReport(report.id, target ? { email: target } : {});
      if (res.success) {
        setEmailModalVisible(false);
        Alert.alert('Email sent', `Report emailed to ${res.data?.sentTo ?? target}.`);
      } else {
        Alert.alert('Error', res.message || 'Failed to send email.');
      }
    } catch (error) {
      logger.error(LogCategory.GPS, 'Failed to email report', error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    } finally {
      setEmailing(false);
    }
  };

  const hasReportData =
    !!report && (report.status === 'COMPLETED' || report.status === 'PARTIAL');
  const showEmail = hasReportData && (aiGenerated || !!report?.promotedScanId);
  const scanBusy = scanning || aiBusy;

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

      {/* Step 1 — Run Full Scan (always available) */}
      <TouchableOpacity
        style={[styles.actionButton, styles.actionPrimary]}
        onPress={handleRunScan}
        disabled={scanBusy}
        activeOpacity={0.8}
      >
        {scanning ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.actionIcon}>⚡</Text>
            <View style={styles.actionTextWrap}>
              <Text style={styles.actionButtonText}>
                {report ? 'Re-run Full Scan' : 'Run Full Scan'}
              </Text>
              <Text style={styles.actionButtonSub}>Request a remote OBD diagnostic scan</Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      {errorText && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorText}</Text>
        </View>
      )}

      {loadingReport && !report && !scanning && (
        <ActivityIndicator
          style={{ marginVertical: spacing.md }}
          color={colors.primary.navy}
        />
      )}

      {/* Scanned data — rendered inline once a scan exists */}
      {report && (
        <View style={styles.resultsWrap}>
          <Text style={styles.sectionTitle}>Scan Results</Text>
          <GpsScanReportBody report={report} />
        </View>
      )}

      {/* Step 2 — View Full Report (after a completed scan) */}
      {hasReportData && (
        <TouchableOpacity
          style={[styles.actionButton, styles.actionSecondary]}
          onPress={handleViewReport}
          disabled={aiBusy}
          activeOpacity={0.8}
        >
          {aiBusy ? (
            <ActivityIndicator color={colors.primary.navy} size="small" />
          ) : (
            <>
              <Text style={styles.actionIcon}>📊</Text>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionButtonText, { color: colors.primary.navy }]}>
                  View Full Report
                </Text>
                <Text style={styles.actionButtonSubDark}>
                  Generate an AI report from the scanned data
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Step 3 — Email Report (after the AI report is generated) */}
      {showEmail && (
        <TouchableOpacity
          style={[styles.actionButton, styles.actionSecondary]}
          onPress={openEmailModal}
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
                  Send the full report PDF via email
                </Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Email recipient modal */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Email Report</Text>
            <Text style={styles.modalSubtitle}>
              Send the full report PDF to this address.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={emailValue}
              onChangeText={setEmailValue}
              placeholder="name@example.com"
              placeholderTextColor={colors.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!emailing}
            />
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setEmailModalVisible(false)}
                disabled={emailing}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={handleSendEmail}
                disabled={emailing || emailValue.trim().length === 0}
                activeOpacity={0.8}
              >
                {emailing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  resultsWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 18,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  modalCancel: {
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  modalConfirm: {
    backgroundColor: colors.primary.navy,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
