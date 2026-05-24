// DeviceSettingsScreen — read-only GPS terminal info + Request Locate.
//
// In our pairing model, vehicle pairing/unpairing is admin-only, so this
// screen deliberately exposes no destructive controls. It surfaces:
//
//   • Identity (IMEI, manufacturer/model, firmware/hardware versions)
//   • Vehicle (VIN, year/make/model, plate, nickname)
//   • Reporting (heartbeat + report intervals)
//   • Status (last connect / disconnect / heartbeat)
//   • Action: Request live position (locate command)
//
// The Unpair button in the spec is gated behind admin role and is omitted
// here for end users. We expose it as a disabled-with-tooltip row so the
// affordance is discoverable.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppStore } from '../store/appStore';
import { gpsApi } from '../services/gps/GpsApiService';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { GpsTerminal } from '../types/gps';

type DeviceSettingsRoute = RouteProp<RootStackParamList, 'DeviceSettings'>;

export const DeviceSettingsScreen: React.FC = () => {
  const route = useRoute<DeviceSettingsRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { terminalId } = route.params;
  const { gpsTerminals, upsertGpsTerminal } = useAppStore();

  const [terminal, setTerminal] = useState<GpsTerminal | undefined>(
    gpsTerminals.find((t) => t.id === terminalId),
  );
  const [loading, setLoading] = useState(!terminal);
  const [locating, setLocating] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameValue, setNicknameValue] = useState(terminal?.nickname ?? '');
  const [savingNickname, setSavingNickname] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await gpsApi.getTerminal(terminalId);
      if (cancelled) return;
      if (result.success && result.data) {
        setTerminal(result.data.terminal);
        upsertGpsTerminal(result.data.terminal);
      } else {
        logger.warn(LogCategory.APP, '[DeviceSettings] getTerminal failed', {
          message: result.message,
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [terminalId, upsertGpsTerminal]);

  const onSaveNickname = async () => {
    setSavingNickname(true);
    const result = await gpsApi.renameTerminal(terminalId, { nickname: nicknameValue.trim() });
    setSavingNickname(false);
    if (result.success && result.data) {
      setTerminal(result.data.terminal);
      upsertGpsTerminal(result.data.terminal);
      setEditingNickname(false);
    } else {
      Alert.alert('Could not rename', result.message ?? 'Try again later.');
    }
  };

  const onLocate = async () => {
    setLocating(true);
    const result = await gpsApi.requestLocate(terminalId);
    setLocating(false);
    if (result.success) {
      Alert.alert(
        'Locate requested',
        'The device will reply with its current position shortly.',
      );
    } else {
      Alert.alert(
        'Could not request locate',
        result.message ?? 'The command could not be queued.',
      );
    }
  };

  if (loading || !terminal) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
      </View>
    );
  }

  // Pairing is admin-only and lives in the web console; the mobile User
  // model exposes no role field, so we surface unpair as a permanently
  // disabled affordance.
  const isAdmin = false;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Section title="Identity">
        <Row label="Device ID" value={terminal.deviceIdentifier} mono />
        <Row label="IMEI" value={terminal.imei ?? '—'} mono />
        <Row label="Manufacturer" value={terminal.manufacturerId ?? '—'} />
        <Row label="Model" value={terminal.terminalModel ?? '—'} />
        <Row label="Firmware" value={terminal.firmwareVersion ?? '—'} />
        <Row label="Hardware" value={terminal.hardwareVersion ?? '—'} />
      </Section>

      <Section title="Vehicle">
        {editingNickname ? (
          <View style={styles.nicknameEditRow}>
            <Text style={styles.rowLabel}>Nickname</Text>
            <View style={styles.nicknameEditInputWrap}>
              <TextInput
                style={styles.nicknameInput}
                value={nicknameValue}
                onChangeText={setNicknameValue}
                placeholder="e.g. Lot 12 — 2024 F-150"
                placeholderTextColor={colors.text.muted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={onSaveNickname}
              />
              <View style={styles.nicknameEditBtns}>
                <TouchableOpacity
                  style={[styles.nicknameSaveBtn, savingNickname && styles.btnDisabled]}
                  onPress={onSaveNickname}
                  disabled={savingNickname}
                >
                  <Text style={styles.nicknameSaveBtnText}>
                    {savingNickname ? 'Saving…' : 'Save'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nicknameCancelBtn}
                  onPress={() => {
                    setEditingNickname(false);
                    setNicknameValue(terminal.nickname ?? '');
                  }}
                >
                  <Text style={styles.nicknameCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.row}
            onPress={() => setEditingNickname(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.rowLabel}>Nickname</Text>
            <View style={styles.nicknameValueRow}>
              <Text style={styles.rowValue} numberOfLines={1}>
                {terminal.nickname ?? '—'}
              </Text>
              <Text style={styles.nicknameEditLink}>Edit</Text>
            </View>
          </TouchableOpacity>
        )}
        <Row label="VIN" value={terminal.vehicleVin ?? '—'} mono />
        <Row
          label="Vehicle"
          value={
            [terminal.vehicleYear, terminal.vehicleMake, terminal.vehicleModel]
              .filter(Boolean)
              .join(' ') || '—'
          }
        />
        <Row label="Plate" value={terminal.plateNumber ?? '—'} />
      </Section>

      <Section title="Reporting">
        <Row
          label="Report interval"
          value={
            terminal.reportIntervalSec != null
              ? `${terminal.reportIntervalSec}s`
              : '—'
          }
        />
        <Row
          label="Heartbeat interval"
          value={
            terminal.heartbeatIntervalSec != null
              ? `${terminal.heartbeatIntervalSec}s`
              : '—'
          }
        />
      </Section>

      <Section title="Connection">
        <Row label="Status" value={terminal.status} />
        <Row label="Last heartbeat" value={formatTime(terminal.lastHeartbeatAt)} />
        <Row label="Connected at" value={formatTime(terminal.connectedAt)} />
        <Row label="Disconnected at" value={formatTime(terminal.disconnectedAt)} />
      </Section>

      <View style={styles.actionsCard}>
        <TouchableOpacity
          style={[styles.btnPrimary, locating && styles.btnDisabled]}
          onPress={onLocate}
          disabled={locating}
        >
          <Text style={styles.btnPrimaryText}>
            {locating ? 'Requesting…' : 'Request live position'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnGhost}
          onPress={() => navigation.navigate('LiveTrack', { terminalId })}
        >
          <Text style={styles.btnGhostText}>View live tracking →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnGhost, !isAdmin && styles.btnGhostDisabled]}
          disabled={!isAdmin}
          onPress={() =>
            Alert.alert(
              'Unpair device',
              'Unpairing is performed by an administrator from the web console.',
            )
          }
        >
          <Text
            style={[styles.btnGhostText, !isAdmin && styles.btnGhostTextDisabled]}
          >
            {isAdmin ? 'Unpair device →' : 'Unpair (admin only)'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, mono && styles.rowValueMono]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.screenHorizontal, paddingBottom: 120 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  rowLabel: { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },
  rowValue: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  rowValueMono: { fontFamily: 'monospace' as any, fontSize: 12 },

  actionsCard: { marginTop: 12 },
  btnPrimary: {
    backgroundColor: colors.primary.navy,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  btnGhost: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  btnGhostDisabled: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  btnGhostText: { color: colors.primary.navy, fontWeight: '700' },
  btnGhostTextDisabled: { color: colors.text.muted },

  nicknameEditRow: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  nicknameEditInputWrap: { marginTop: 6 },
  nicknameInput: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.text.primary,
    backgroundColor: '#FFFFFF',
  },
  nicknameEditBtns: { flexDirection: 'row', marginTop: 8, gap: 8 },
  nicknameSaveBtn: {
    backgroundColor: colors.primary.navy,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  nicknameSaveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  nicknameCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  nicknameCancelBtnText: { color: colors.text.secondary, fontWeight: '600', fontSize: 13 },
  nicknameValueRow: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', marginLeft: 12 },
  nicknameEditLink: { color: colors.primary.navy, fontWeight: '700', fontSize: 12, marginLeft: 8 },
});
