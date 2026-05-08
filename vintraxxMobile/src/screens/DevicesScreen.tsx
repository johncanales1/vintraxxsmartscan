// DevicesScreen — unified Bluetooth + GPS Vehicles tab.
//
// This is the new Tab #1, replacing the old "Connect" tab. It provides a
// segmented control to switch between two device types:
//
//   • Bluetooth: hosts the existing ConnectScreen body unchanged. We pass
//     props via a small wrapper so the BLE logic (auto-nav to Scan after
//     connect, DEV-mode 7-tap, etc.) keeps working exactly as before.
//   • GPS Vehicles: lists terminals owned by the current user. Empty state
//     guides them to contact admin (read-only pairing model). Paired state
//     shows online dots, KPIs, alerts shortcut, and per-card actions.
//
// The dealer pill that used to live in DealerBadgeHeader (killed in the
// Option B rewrite) is now rendered here, top-right.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ConnectScreen } from './ConnectScreen';
import { useAppStore } from '../store/appStore';
import { gpsApi } from '../services/gps/GpsApiService';
import { gpsWs, GpsWsState } from '../services/gps/GpsWsClient';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import type { RootStackParamList } from '../navigation/types';
import type { GpsTerminal, GpsLocation } from '../types/gps';

import ConnectIcon from '../assets/icons/connect.svg';
import CarIcon from '../assets/icons/car.svg';
import WarningIcon from '../assets/icons/warning.svg';

interface DevicesScreenProps {
  route?: {
    params?: {
      autoConnect?: boolean;
      autoScan?: boolean;
      segment?: 'bluetooth' | 'gps';
    };
  };
}

type Segment = 'bluetooth' | 'gps';

export const DevicesScreen: React.FC<DevicesScreenProps> = ({ route }) => {
  const initial = route?.params?.segment ?? 'bluetooth';
  const [segment, setSegment] = useState<Segment>(initial);
  const { user } = useAppStore();
  const isDealer = user?.isDealer === true;

  // Sync segment if a deep-link forces a specific tab.
  useEffect(() => {
    if (route?.params?.segment) setSegment(route.params.segment);
  }, [route?.params?.segment]);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <Text style={styles.headerAppName}>VinTraxx</Text>
          <View
            style={[
              styles.dealerBadge,
              isDealer ? styles.dealerBadgeDealer : styles.dealerBadgeRegular,
            ]}
          >
            <Text style={styles.dealerBadgeText}>
              {isDealer ? 'Dealer' : 'Non-Dealer'}
            </Text>
          </View>
        </View>

        {/* Segmented control */}
        <View style={styles.segWrap}>
          <SegmentChip
            label="Bluetooth"
            active={segment === 'bluetooth'}
            onPress={() => setSegment('bluetooth')}
          />
          <SegmentChip
            label="GPS Vehicles"
            active={segment === 'gps'}
            onPress={() => setSegment('gps')}
          />
        </View>
      </SafeAreaView>

      {/* Body — switch on segment. We keep both mounted via display:none so
          BLE state (scanning, connecting) doesn't reset when the user
          flips between tabs. */}
      <View style={styles.body}>
        <View style={[styles.segPane, segment !== 'bluetooth' && styles.segPaneHidden]}>
          {/* ConnectScreen ignores `navigation` for its core BLE flow but
              uses it for the auto-redirect to the Scan tab once connected.
              We pass the parent navigator through. */}
          <BluetoothPanel
            autoConnect={route?.params?.autoConnect}
            autoScan={route?.params?.autoScan}
          />
        </View>

        <View style={[styles.segPane, segment !== 'gps' && styles.segPaneHidden]}>
          <GpsPanel />
        </View>
      </View>
    </View>
  );
};

// ── Segmented control chip ───────────────────────────────────────────────

const SegmentChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.segChip, active && styles.segChipActive]}
    accessibilityRole="tab"
    accessibilityState={{ selected: active }}
    activeOpacity={0.85}
  >
    <Text
      style={[styles.segChipLabel, active && styles.segChipLabelActive]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// ── Bluetooth panel (delegates to existing ConnectScreen) ────────────────

const BluetoothPanel: React.FC<{ autoConnect?: boolean; autoScan?: boolean }> = ({
  autoConnect,
  autoScan,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // ConnectScreen expects `route?.params?.{autoConnect, autoScan}` and a
  // navigation prop with `.navigate('Scan'|'Diagnostics', ...)`. We pass
  // both through a synthetic params object.
  // ConnectScreen accepts `navigation: any` so the cast here is just to
  // adapt the typed Stack navigator into the loose prop it expects.
  return (
    <ConnectScreen
      navigation={navigation as unknown as { navigate: (...args: unknown[]) => void }}
      route={{ params: { autoConnect, autoScan } }}
    />
  );
};

// ── GPS Vehicles panel ───────────────────────────────────────────────────

const GpsPanel: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    gpsTerminals,
    setGpsTerminals,
    upsertGpsTerminal,
    setSelectedTerminalId,
    gpsLatestLocations,
    gpsAlarms,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [wsState, setWsState] = useState<GpsWsState>(gpsWs.getState());
  const [actionFor, setActionFor] = useState<GpsTerminal | null>(null);
  const [renaming, setRenaming] = useState<GpsTerminal | null>(null);

  const fetchTerminals = useCallback(async () => {
    const result = await gpsApi.listTerminals();
    if (!result.success || !result.data) {
      logger.warn(LogCategory.APP, '[Devices] listTerminals failed', {
        message: result.message,
      });
      return;
    }
    setGpsTerminals(result.data.terminals);
  }, [setGpsTerminals]);

  useEffect(() => {
    setLoading(true);
    void fetchTerminals().finally(() => setLoading(false));
  }, [fetchTerminals]);

  // Live updates: terminal status flips + new alarms cause a refresh.
  useEffect(() => {
    const offState = gpsWs.on('state', setWsState);
    const offOnline = gpsWs.on('terminal.online', (e) => {
      const t = gpsTerminals.find((x) => x.id === e.terminalId);
      if (t) upsertGpsTerminal({ ...t, status: 'ONLINE', lastHeartbeatAt: e.at });
    });
    const offOffline = gpsWs.on('terminal.offline', (e) => {
      const t = gpsTerminals.find((x) => x.id === e.terminalId);
      if (t) upsertGpsTerminal({ ...t, status: 'OFFLINE', disconnectedAt: e.at });
    });
    return () => {
      offState();
      offOnline();
      offOffline();
    };
  }, [gpsTerminals, upsertGpsTerminal]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTerminals();
    setRefreshing(false);
  };

  const stats = useMemo(() => {
    const online = gpsTerminals.filter((t) => t.status === 'ONLINE').length;
    const offline = gpsTerminals.filter((t) => t.status !== 'ONLINE').length;
    const sinceMs = Date.now() - 24 * 60 * 60 * 1000;
    const alarms24 = gpsAlarms.filter(
      (a) => new Date(a.openedAt).getTime() >= sinceMs,
    ).length;
    return { online, offline, alarms24 };
  }, [gpsTerminals, gpsAlarms]);

  const onCardPress = (t: GpsTerminal) => {
    setSelectedTerminalId(t.id);
    navigation.navigate('LiveTrack', { terminalId: t.id });
  };
  const onAlertsPress = (t: GpsTerminal) => {
    navigation.navigate('Alerts', { terminalId: t.id });
  };

  if (gpsTerminals.length === 0 && !loading) {
    return <GpsEmptyState />;
  }

  return (
    <ScrollView
      style={styles.gpsScroll}
      contentContainerStyle={styles.gpsScrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.gpsStatsRow}>
        <StatPill label="Online" value={stats.online} accent={colors.status.success} />
        <StatPill label="Offline" value={stats.offline} accent={colors.text.muted} />
        <StatPill
          label="Alarms 24h"
          value={stats.alarms24}
          accent={stats.alarms24 > 0 ? colors.status.error : colors.text.muted}
        />
      </View>

      <View style={styles.wsBanner}>
        <View
          style={[
            styles.wsBannerDot,
            wsState === 'open'
              ? styles.wsBannerDotLive
              : wsState === 'connecting'
              ? styles.wsBannerDotConnecting
              : styles.wsBannerDotOffline,
          ]}
        />
        <Text style={styles.wsBannerText}>
          {wsState === 'open'
            ? 'Live'
            : wsState === 'connecting'
            ? 'Reconnecting…'
            : 'Offline (pull to refresh)'}
        </Text>
      </View>

      {gpsTerminals.map((t) => (
        <VehicleCard
          key={t.id}
          terminal={t}
          location={gpsLatestLocations[t.id]}
          unreadAlarmCount={
            gpsAlarms.filter(
              (a) => a.terminalId === t.id && !a.acknowledged && !a.closedAt,
            ).length
          }
          onPress={() => onCardPress(t)}
          onAlertsPress={() => onAlertsPress(t)}
          onMorePress={() => setActionFor(t)}
        />
      ))}

      {/* Action sheet (Rename / Device Settings). Unpair is admin-only and
          deliberately omitted in the read-only pairing model. */}
      <ActionSheet
        terminal={actionFor}
        onClose={() => setActionFor(null)}
        onRename={() => {
          setRenaming(actionFor);
          setActionFor(null);
        }}
        onSettings={() => {
          if (actionFor) {
            navigation.navigate('DeviceSettings', { terminalId: actionFor.id });
          }
          setActionFor(null);
        }}
      />

      <RenameModal
        terminal={renaming}
        onClose={() => setRenaming(null)}
        onSubmit={async (nickname) => {
          if (!renaming) return;
          const result = await gpsApi.renameTerminal(renaming.id, { nickname });
          if (result.success && result.data) {
            upsertGpsTerminal(result.data.terminal);
          } else {
            Alert.alert('Rename failed', result.message ?? 'Please try again.');
          }
          setRenaming(null);
        }}
      />
    </ScrollView>
  );
};

// ── Empty state ──────────────────────────────────────────────────────────

const GpsEmptyState: React.FC = () => {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconHalo}>
        <CarIcon width={48} height={48} color={colors.primary.navy} />
      </View>
      <Text style={styles.emptyTitle}>No GPS Smart-Scanner paired yet</Text>
      <Text style={styles.emptySubtitle}>
        Contact your administrator or dealer to register a device for this account.
      </Text>
      <TouchableOpacity
        style={styles.emptyGhostBtn}
        onPress={() => setShowInfo(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.emptyGhostBtnText}>How does this work?</Text>
      </TouchableOpacity>

      <Modal
        visible={showInfo}
        animationType="fade"
        transparent
        onRequestClose={() => setShowInfo(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowInfo(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>VinTraxx GPS Smart-Scanner</Text>
            <Text style={styles.modalBody}>
              The GPS Smart-Scanner is an installed always-on telematics device. It
              continuously reports your vehicle's position, OBD telemetry, and
              alerts. Pairing is done by your fleet administrator — once they assign
              a device to your account, it will appear here automatically.
            </Text>
            <TouchableOpacity
              onPress={() => setShowInfo(false)}
              style={styles.modalCloseBtn}
            >
              <Text style={styles.modalCloseText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────────

const StatPill: React.FC<{ label: string; value: number; accent: string }> = ({
  label,
  value,
  accent,
}) => (
  <View style={styles.statPill}>
    <View style={[styles.statPillDot, { backgroundColor: accent }]} />
    <Text style={styles.statPillLabel}>{label}</Text>
    <Text style={styles.statPillValue}>{value}</Text>
  </View>
);

const VehicleCard: React.FC<{
  terminal: GpsTerminal;
  location: GpsLocation | undefined;
  unreadAlarmCount: number;
  onPress: () => void;
  onAlertsPress: () => void;
  onMorePress: () => void;
}> = ({ terminal: t, location, unreadAlarmCount, onPress, onAlertsPress, onMorePress }) => {
  const online = t.status === 'ONLINE';
  const lastSeen = formatRelativeTime(t.lastHeartbeatAt);
  // Canonical device identifier is always populated; IMEI is metadata that
  // may be null on auto-provisioned or legacy 2013-spec devices.
  const fallbackTail = (t.deviceIdentifier ?? t.imei ?? '').slice(-6);
  const vehicleLabel =
    t.nickname ||
    [t.vehicleYear, t.vehicleMake, t.vehicleModel].filter(Boolean).join(' ') ||
    `Device ${fallbackTail}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {vehicleLabel}
        </Text>
        <TouchableOpacity onPress={onMorePress} hitSlop={12} accessibilityLabel="More actions">
          <Text style={styles.cardMore}>⋯</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardChipRow}>
        {t.vehicleVin && (
          <View style={styles.cardChip}>
            <Text style={styles.cardChipText}>VIN {t.vehicleVin}</Text>
          </View>
        )}
        {t.plateNumber && (
          <View style={styles.cardChip}>
            <Text style={styles.cardChipText}>Plate {t.plateNumber}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardStatusRow}>
        <View
          style={[
            styles.cardStatusDot,
            online ? styles.cardStatusDotOnline : styles.cardStatusDotOffline,
          ]}
        />
        <Text style={styles.cardStatusText}>
          {online ? 'Online' : 'Offline'} · Last seen {lastSeen}
        </Text>
      </View>

      <View style={styles.cardKpiRow}>
        <Text style={styles.cardKpi}>
          Speed {location?.speedKmh != null ? Math.round(location.speedKmh * 0.621371) : '—'} mph
        </Text>
        <Text style={styles.cardKpi}>
          Batt {location?.externalVoltageMv != null ? (location.externalVoltageMv / 1000).toFixed(1) : '—'} V
        </Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.cardActionBtn, styles.cardActionPrimary]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={styles.cardActionPrimaryText}>View Live</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cardActionBtn, styles.cardActionGhost]}
          onPress={onAlertsPress}
          activeOpacity={0.85}
        >
          <WarningIcon
            width={14}
            height={14}
            color={unreadAlarmCount > 0 ? colors.status.error : colors.text.secondary}
          />
          <Text
            style={[
              styles.cardActionGhostText,
              unreadAlarmCount > 0 && styles.cardActionGhostTextActive,
            ]}
          >
            {unreadAlarmCount > 0 ? `Alerts (${unreadAlarmCount})` : 'Alerts'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const ActionSheet: React.FC<{
  terminal: GpsTerminal | null;
  onClose: () => void;
  onRename: () => void;
  onSettings: () => void;
}> = ({ terminal, onClose, onRename, onSettings }) => (
  <Modal
    visible={!!terminal}
    animationType="fade"
    transparent
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalBackdrop} onPress={onClose}>
      <Pressable style={styles.actionSheet} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.actionSheetTitle} numberOfLines={1}>
          {terminal?.nickname || 'Device actions'}
        </Text>
        <ActionRow label="Rename" onPress={onRename} />
        <ActionRow label="Device Settings" onPress={onSettings} />
        <ActionRow label="Cancel" onPress={onClose} muted />
      </Pressable>
    </Pressable>
  </Modal>
);

const ActionRow: React.FC<{ label: string; onPress: () => void; muted?: boolean }> = ({
  label,
  onPress,
  muted,
}) => (
  <TouchableOpacity onPress={onPress} style={styles.actionRow} activeOpacity={0.7}>
    <Text style={[styles.actionRowText, muted && styles.actionRowTextMuted]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const RenameModal: React.FC<{
  terminal: GpsTerminal | null;
  onClose: () => void;
  onSubmit: (nickname: string) => void;
}> = ({ terminal, onClose, onSubmit }) => {
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue(terminal?.nickname ?? '');
  }, [terminal]);

  return (
    <Modal
      visible={!!terminal}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Rename device</Text>
          <Text style={styles.modalBody}>This is just a label for your fleet view.</Text>
          {/* Lazy-import to avoid importing TextInput at the top — tab bar
              keyboardWillShow handler reads input focus state. */}
          <RenameInput value={value} onChange={setValue} />
          <View style={styles.renameButtonRow}>
            <TouchableOpacity onPress={onClose} style={styles.renameCancelBtn}>
              <Text style={styles.renameCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSubmit(value.trim())}
              style={[styles.renameSaveBtn, !value.trim() && styles.renameSaveBtnDisabled]}
              disabled={!value.trim()}
            >
              <Text style={styles.renameSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const RenameInput: React.FC<{ value: string; onChange: (s: string) => void }> = ({
  value,
  onChange,
}) => (
  <TextInput
    value={value}
    onChangeText={onChange}
    autoFocus
    placeholder="e.g. Shop truck 1"
    placeholderTextColor={colors.text.muted}
    maxLength={64}
    style={styles.renameInput}
  />
);

// ── Utilities ────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },

  headerWrap: { backgroundColor: colors.primary.navy },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
  },
  headerAppName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dealerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dealerBadgeDealer: {
    backgroundColor: colors.primary.navyLight,
  },
  dealerBadgeRegular: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dealerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  segWrap: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
  },
  segChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 4,
  },
  segChipActive: {
    backgroundColor: '#FFFFFF',
  },
  segChipLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  segChipLabelActive: {
    color: colors.primary.navy,
    fontWeight: '700',
  },

  body: { flex: 1 },
  segPane: { flex: 1 },
  segPaneHidden: { display: 'none' },

  // ── GPS panel ──────────────────────────────────────────────────────
  gpsScroll: { flex: 1, backgroundColor: colors.background.primary },
  gpsScrollContent: {
    padding: spacing.screenHorizontal,
    paddingBottom: 120, // clear the floating tab bar
  },
  gpsStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: spacing.cardRadius,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statPillDot: { width: 8, height: 8, borderRadius: 4 },
  statPillLabel: { fontSize: 12, color: colors.text.secondary, fontWeight: '600' },
  statPillValue: { fontSize: 16, fontWeight: '700', color: colors.text.primary },

  wsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: spacing.sm,
  },
  wsBannerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  wsBannerDotLive: { backgroundColor: colors.status.success },
  wsBannerDotConnecting: { backgroundColor: colors.status.warning },
  wsBannerDotOffline: { backgroundColor: colors.text.muted },
  wsBannerText: { fontSize: 12, color: colors.text.secondary, fontWeight: '600' },

  // Vehicle card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  cardMore: { fontSize: 22, color: colors.text.secondary, lineHeight: 22 },
  cardChipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cardChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginRight: 6,
    marginTop: 4,
  },
  cardChipText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  cardStatusDotOnline: { backgroundColor: colors.status.success },
  cardStatusDotOffline: { backgroundColor: colors.text.muted },
  cardStatusText: { fontSize: 12, color: colors.text.secondary, fontWeight: '600' },
  cardKpiRow: { flexDirection: 'row', marginTop: 6 },
  cardKpi: {
    fontSize: 12,
    color: colors.text.primary,
    fontWeight: '600',
    marginRight: 12,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
  },
  cardActionPrimary: { backgroundColor: colors.primary.navy },
  cardActionPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardActionGhost: {
    backgroundColor: '#F1F5F9',
  },
  cardActionGhostText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardActionGhostTextActive: {
    color: colors.status.error,
    fontWeight: '700',
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  emptyIconHalo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(30,58,95,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  emptyGhostBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  emptyGhostBtnText: {
    color: colors.primary.navy,
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal + action sheet
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: spacing.screenHorizontal,
  },
  actionSheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.muted,
    paddingVertical: 8,
  },
  actionRow: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionRowText: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actionRowTextMuted: { color: colors.text.muted },

  modalCard: {
    backgroundColor: '#FFFFFF',
    margin: spacing.screenHorizontal,
    padding: spacing.lg,
    borderRadius: 16,
    alignSelf: 'stretch',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary.navy,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  renameInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text.primary,
    backgroundColor: '#F9FAFB',
    marginBottom: spacing.md,
  },
  renameButtonRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  renameCancelBtn: { paddingVertical: 10, paddingHorizontal: 14, marginRight: 8 },
  renameCancelText: { color: colors.text.secondary, fontWeight: '700' },
  renameSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: colors.primary.navy,
  },
  renameSaveBtnDisabled: { opacity: 0.4 },
  renameSaveText: { color: '#FFFFFF', fontWeight: '700' },
});

// `typography` import is unused above but reserved for future text-style
// alignment with the rest of the app. Re-export to silence unused import.
void typography;
void ConnectIcon;
