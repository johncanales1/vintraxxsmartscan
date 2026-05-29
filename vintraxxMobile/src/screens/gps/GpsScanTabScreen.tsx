// GpsScanTabScreen — GPS Scan tab: list of user's GPS terminals.
//
// Each terminal card shows: vehicle label, VIN, status dot, last heartbeat,
// device ID. Tap a card → GpsTerminalDetailScreen.

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppStore } from '../../store/appStore';
import { gpsApi } from '../../services/gps/GpsApiService';
import { gpsWs } from '../../services/gps/GpsWsClient';
import { logger, LogCategory } from '../../utils/Logger';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';
import type { GpsTerminal } from '../../types/gps';

import CarIcon from '../../assets/icons/car.svg';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Helpers ────────────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ONLINE:          { color: '#16A34A', label: 'Online' },
  OFFLINE:         { color: '#DC2626', label: 'Offline' },
  NEVER_CONNECTED: { color: '#9CA3AF', label: 'Never Connected' },
  REVOKED:         { color: '#6B7280', label: 'Revoked' },
};

// ── Terminal Card ──────────────────────────────────────────────────────────

const TerminalCard: React.FC<{
  terminal: GpsTerminal;
  onPress: () => void;
}> = ({ terminal, onPress }) => {
  const status = STATUS_CONFIG[terminal.status] ?? STATUS_CONFIG.OFFLINE;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary.navy }]}>
          <CarIcon width={22} height={22} color="#FFFFFF" />
        </View>
      </View>
      <View style={styles.cardCenter}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {vehicleLabel(terminal)}
        </Text>
        {terminal.vehicleVin && (
          <Text style={styles.cardVin} numberOfLines={1}>
            VIN: {terminal.vehicleVin}
          </Text>
        )}
        <Text style={styles.cardMeta}>
          ID: {terminal.deviceIdentifier} · {formatRelative(terminal.lastHeartbeatAt)}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <Text style={[styles.statusLabel, { color: status.color }]}>
          {status.label}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Screen ─────────────────────────────────────────────────────────────────

export const GpsScanTabScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {
    gpsTerminals,
    setGpsTerminals,
    upsertGpsTerminal,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTerminals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      logger.info(LogCategory.GPS, 'Fetching GPS terminals');
      const result = await gpsApi.listTerminals();
      if (result.success && result.data) {
        const list = (result.data as any).terminals ?? [];
        setGpsTerminals(list);
        logger.info(LogCategory.GPS, `Loaded ${list.length} terminals`);
      }
    } catch (error) {
      logger.error(LogCategory.GPS, 'Failed to fetch terminals', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setGpsTerminals]);

  useFocusEffect(
    useCallback(() => {
      fetchTerminals();
    }, [fetchTerminals]),
  );

  // WS: update terminal status live
  useEffect(() => {
    const offOnline = gpsWs.on('terminal.online', (e: any) => {
      const existing = useAppStore.getState().gpsTerminals.find((t) => t.id === e.terminalId);
      if (existing) {
        upsertGpsTerminal({ ...existing, status: 'ONLINE', connectedAt: e.at, lastHeartbeatAt: e.at });
      }
    });
    const offOffline = gpsWs.on('terminal.offline', (e: any) => {
      const existing = useAppStore.getState().gpsTerminals.find((t) => t.id === e.terminalId);
      if (existing) {
        upsertGpsTerminal({ ...existing, status: 'OFFLINE', disconnectedAt: e.at });
      }
    });
    return () => {
      offOnline();
      offOffline();
    };
  }, [upsertGpsTerminal]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTerminals(true);
  }, [fetchTerminals]);

  const handleTerminalPress = useCallback((terminal: GpsTerminal) => {
    logger.info(LogCategory.GPS, `Selected terminal: ${terminal.deviceIdentifier}`);
    navigation.navigate('GpsTerminalDetail', { terminalId: terminal.id });
  }, [navigation]);

  const onlineCount = gpsTerminals.filter((t) => t.status === 'ONLINE').length;
  const offlineCount = gpsTerminals.filter((t) => t.status === 'OFFLINE').length;

  if (loading && gpsTerminals.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
        <Text style={styles.loadingText}>Loading terminals...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>GPS Fleet</Text>
        <Text style={styles.headerSubtitle}>
          {gpsTerminals.length} device{gpsTerminals.length !== 1 ? 's' : ''} ·{' '}
          <Text style={{ color: '#16A34A' }}>{onlineCount} online</Text> ·{' '}
          {offlineCount} offline
        </Text>
      </SafeAreaView>

      <FlatList
        data={gpsTerminals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TerminalCard
            terminal={item}
            onPress={() => handleTerminalPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.navy}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CarIcon width={48} height={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No GPS Terminals</Text>
            <Text style={styles.emptySubtitle}>
              No GPS terminals are paired with your account. Contact your
              administrator to provision a device.
            </Text>
          </View>
        }
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.primary.navy,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    paddingTop: spacing.md,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
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
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  cardLeft: {
    marginRight: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenter: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  cardVin: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.text.muted,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  chevron: {
    fontSize: 22,
    color: colors.text.muted,
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
