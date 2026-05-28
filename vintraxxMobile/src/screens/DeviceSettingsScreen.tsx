// DeviceDetailsScreen — read-only GPS terminal info.
//
// Surfaces:
//   • Identity (IMEI, manufacturer/model, firmware/hardware versions)
//   • Vehicle (VIN, year/make/model, plate, nickname)
//   • Reporting (heartbeat + report intervals)
//   • Status (last connect / disconnect / heartbeat)

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
import { useRoute, RouteProp } from '@react-navigation/native';

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
  const { terminalId } = route.params;
  const { gpsTerminals, upsertGpsTerminal } = useAppStore();

  const [terminal, setTerminal] = useState<GpsTerminal | undefined>(
    gpsTerminals.find((t) => t.id === terminalId),
  );
  const [loading, setLoading] = useState(!terminal);
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

  if (loading || !terminal) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
      </View>
    );
  }

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
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary.navy,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  rowLabel: { fontSize: 14, color: colors.text.secondary, fontWeight: '500' },
  rowValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  rowValueMono: { fontFamily: 'monospace' as any, fontSize: 13 },
  btnDisabled: { opacity: 0.5 },

  nicknameEditRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.light,
  },
  nicknameEditInputWrap: { marginTop: 8 },
  nicknameInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: '#F8FAFC',
  },
  nicknameEditBtns: { flexDirection: 'row', marginTop: 10, gap: 8 },
  nicknameSaveBtn: {
    backgroundColor: colors.primary.navy,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  nicknameSaveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  nicknameCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  nicknameCancelBtnText: { color: colors.text.secondary, fontWeight: '600', fontSize: 14 },
  nicknameValueRow: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', marginLeft: 12 },
  nicknameEditLink: { color: colors.primary.navy, fontWeight: '700', fontSize: 13, marginLeft: 8 },
});
