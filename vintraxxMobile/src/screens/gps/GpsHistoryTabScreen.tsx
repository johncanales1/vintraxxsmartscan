// GpsHistoryTabScreen — GPS History tab with segmented sub-tabs.
//
// Sub-tabs: Scans | DTCs | Alerts | Trips
// Each sub-tab fetches from gpsApi and renders modern card/list UI.
// All items support long-press to delete.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../../store/appStore';
import { gpsApi } from '../../services/gps/GpsApiService';
import { logger, LogCategory } from '../../utils/Logger';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type {
  GpsScanReport,
  GpsDtcEvent,
  GpsAlarm,
  GpsTrip,
  GpsTerminal,
} from '../../types/gps';

type SubTab = 'scans' | 'dtcs' | 'alerts' | 'trips';

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Sub-tab selector ──────────────────────────────────────────────────────

const SubTabBar: React.FC<{
  active: SubTab;
  onChange: (tab: SubTab) => void;
}> = ({ active, onChange }) => {
  const tabs: { key: SubTab; label: string }[] = [
    { key: 'scans', label: 'Scans' },
    { key: 'dtcs', label: 'DTCs' },
    { key: 'alerts', label: 'Alerts' },
    { key: 'trips', label: 'Trips' },
  ];

  return (
    <View style={styles.subTabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.subTab, active === tab.key && styles.subTabActive]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.subTabText,
              active === tab.key && styles.subTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ── Scans List ─────────────────────────────────────────────────────────────

const ScansPanel: React.FC = () => {
  const { gpsTerminals } = useAppStore();
  const [reports, setReports] = useState<GpsScanReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const results = await Promise.allSettled(
        gpsTerminals.map((t) =>
          gpsApi.listGpsScanReports(t.id, { limit: 10 }),
        ),
      );
      const all: GpsScanReport[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.success && r.value.data) {
          all.push(...((r.value.data as any).reports ?? []));
        }
      }
      all.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setReports(all);
    } catch (err) {
      logger.error(LogCategory.GPS, 'Failed to fetch scan reports', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gpsTerminals]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleDelete = (id: string) => {
    Alert.alert('Remove', 'Remove this scan report from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setReports((prev) => prev.filter((r) => r.id !== id)),
      },
    ]);
  };

  if (loading) return <LoadingState />;

  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.historyCard}
          onLongPress={() => handleDelete(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.historyCardHeader}>
            <Text style={styles.historyCardIcon}>📊</Text>
            <View style={styles.historyCardText}>
              <Text style={styles.historyCardTitle}>
                {item.vin ?? 'Unknown VIN'}
              </Text>
              <Text style={styles.historyCardSub}>
                Status: {item.status} · {formatDate(item.requestedAt)}
              </Text>
            </View>
            <StatusPill status={item.status} />
          </View>
          {item.storedDtcCodes.length > 0 && (
            <View style={styles.dtcRow}>
              {item.storedDtcCodes.slice(0, 4).map((code) => (
                <View key={code} style={styles.dtcChip}>
                  <Text style={styles.dtcChipText}>{code}</Text>
                </View>
              ))}
              {item.storedDtcCodes.length > 4 && (
                <Text style={styles.dtcMore}>+{item.storedDtcCodes.length - 4}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(true); }} tintColor={colors.primary.navy} />
      }
      ListEmptyComponent={<EmptyState message="No scan reports yet" />}
    />
  );
};

// ── DTCs List ──────────────────────────────────────────────────────────────

const DtcsPanel: React.FC = () => {
  const { gpsDtcEvents, setGpsDtcEvents } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDtcs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await gpsApi.listDtcEvents({ since, limit: 100 });
      if (res.success && res.data) {
        setGpsDtcEvents((res.data as any).events ?? []);
      }
    } catch (err) {
      logger.error(LogCategory.GPS, 'Failed to fetch DTC events', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setGpsDtcEvents]);

  useEffect(() => { fetchDtcs(); }, [fetchDtcs]);

  const handleDelete = (id: string) => {
    Alert.alert('Remove', 'Remove this DTC event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setGpsDtcEvents(useAppStore.getState().gpsDtcEvents.filter((e) => e.id !== id)),
      },
    ]);
  };

  if (loading) return <LoadingState />;

  return (
    <FlatList
      data={gpsDtcEvents}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.historyCard}
          onLongPress={() => handleDelete(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.historyCardHeader}>
            <Text style={styles.historyCardIcon}>⚠️</Text>
            <View style={styles.historyCardText}>
              <Text style={styles.historyCardTitle}>
                {item.vin ?? 'Unknown VIN'}
              </Text>
              <Text style={styles.historyCardSub}>
                {item.dtcCount} code{item.dtcCount !== 1 ? 's' : ''} · MIL {item.milOn ? 'ON' : 'OFF'} · {formatDate(item.reportedAt)}
              </Text>
            </View>
          </View>
          {item.storedDtcCodes.length > 0 && (
            <View style={styles.dtcRow}>
              {item.storedDtcCodes.slice(0, 4).map((code) => (
                <View key={code} style={styles.dtcChipWarn}>
                  <Text style={styles.dtcChipWarnText}>{code}</Text>
                </View>
              ))}
              {item.storedDtcCodes.length > 4 && (
                <Text style={styles.dtcMore}>+{item.storedDtcCodes.length - 4}</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDtcs(true); }} tintColor={colors.primary.navy} />
      }
      ListEmptyComponent={<EmptyState message="No DTC events reported" />}
    />
  );
};

// ── Alerts List ────────────────────────────────────────────────────────────

const AlertsPanel: React.FC = () => {
  const { gpsAlarms, setGpsAlarms } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlarms = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await gpsApi.listAlarms({ since, limit: 100 });
      if (res.success && res.data) {
        setGpsAlarms((res.data as any).alarms ?? []);
      }
    } catch (err) {
      logger.error(LogCategory.GPS, 'Failed to fetch alarms', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setGpsAlarms]);

  useEffect(() => { fetchAlarms(); }, [fetchAlarms]);

  const handleDelete = (id: string) => {
    Alert.alert('Remove', 'Remove this alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setGpsAlarms(useAppStore.getState().gpsAlarms.filter((a) => a.id !== id)),
      },
    ]);
  };

  const severityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return '#DC2626';
      case 'WARNING': return '#D97706';
      default: return '#2563EB';
    }
  };

  if (loading) return <LoadingState />;

  return (
    <FlatList
      data={gpsAlarms}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.historyCard}
          onLongPress={() => handleDelete(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.historyCardHeader}>
            <Text style={styles.historyCardIcon}>🔔</Text>
            <View style={styles.historyCardText}>
              <Text style={styles.historyCardTitle}>
                {item.type.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.historyCardSub}>
                {formatDate(item.openedAt)}{item.closedAt ? ' · Closed' : ' · Open'}
              </Text>
            </View>
            <View style={[styles.severityPill, { backgroundColor: severityColor(item.severity) + '18' }]}>
              <Text style={[styles.severityText, { color: severityColor(item.severity) }]}>
                {item.severity}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlarms(true); }} tintColor={colors.primary.navy} />
      }
      ListEmptyComponent={<EmptyState message="No alerts" />}
    />
  );
};

// ── Trips List ─────────────────────────────────────────────────────────────

const TripsPanel: React.FC = () => {
  const { gpsTerminals } = useAppStore();
  const [trips, setTrips] = useState<GpsTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const results = await Promise.allSettled(
        gpsTerminals.map((t) => {
          const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          return gpsApi.listTrips(t.id, { since, limit: 20 });
        }),
      );
      const all: GpsTrip[] = [];
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.success && r.value.data) {
          all.push(...((r.value.data as any).trips ?? []));
        }
      }
      all.sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
      setTrips(all);
    } catch (err) {
      logger.error(LogCategory.GPS, 'Failed to fetch trips', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gpsTerminals]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const handleDelete = (id: string) => {
    Alert.alert('Remove', 'Remove this trip?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setTrips((prev) => prev.filter((t) => t.id !== id)),
      },
    ]);
  };

  const formatDistance = (km: number | null) => {
    if (km === null) return '—';
    const mi = km * 0.621371;
    return `${mi.toFixed(1)} mi`;
  };

  const formatDuration = (sec: number | null) => {
    if (sec === null) return '—';
    const mins = Math.round(sec / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  if (loading) return <LoadingState />;

  return (
    <FlatList
      data={trips}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.historyCard}
          onLongPress={() => handleDelete(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.historyCardHeader}>
            <Text style={styles.historyCardIcon}>🚗</Text>
            <View style={styles.historyCardText}>
              <Text style={styles.historyCardTitle}>
                {formatDate(item.startAt)}
              </Text>
              <Text style={styles.historyCardSub}>
                {formatDistance(item.distanceKm)} · {formatDuration(item.durationSec)} · Max {item.maxSpeedKmh ? `${Math.round(item.maxSpeedKmh * 0.621371)} mph` : '—'}
              </Text>
            </View>
            <View style={[styles.tripStatusPill, item.status === 'OPEN' ? styles.tripOpen : styles.tripClosed]}>
              <Text style={[styles.tripStatusText, item.status === 'OPEN' ? styles.tripOpenText : styles.tripClosedText]}>
                {item.status}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrips(true); }} tintColor={colors.primary.navy} />
      }
      ListEmptyComponent={<EmptyState message="No trips recorded" />}
    />
  );
};

// ── Shared components ──────────────────────────────────────────────────────

const LoadingState: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary.navy} />
    <Text style={styles.loadingText}>Loading...</Text>
  </View>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const isComplete = status === 'COMPLETED';
  return (
    <View style={[styles.statusPill, isComplete ? styles.statusComplete : styles.statusPending]}>
      <Text style={[styles.statusPillText, isComplete ? styles.statusCompleteText : styles.statusPendingText]}>
        {status}
      </Text>
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────

export const GpsHistoryTabScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SubTab>('scans');

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
      </SafeAreaView>

      <SubTabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'scans' && <ScansPanel />}
      {activeTab === 'dtcs' && <DtcsPanel />}
      {activeTab === 'alerts' && <AlertsPanel />}
      {activeTab === 'trips' && <TripsPanel />}
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
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    paddingTop: spacing.md,
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginHorizontal: 3,
  },
  subTabActive: {
    backgroundColor: colors.primary.navy,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCardIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  historyCardText: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  historyCardSub: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  dtcRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  dtcChip: {
    backgroundColor: '#DBEAFE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dtcChipText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#1E40AF',
  },
  dtcChipWarn: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dtcChipWarnText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
    color: '#92400E',
  },
  dtcMore: {
    fontSize: 11,
    color: colors.text.muted,
    alignSelf: 'center',
  },
  severityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusComplete: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusCompleteText: {
    color: '#166534',
  },
  statusPendingText: {
    color: '#92400E',
  },
  tripStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tripOpen: {
    backgroundColor: '#DBEAFE',
  },
  tripClosed: {
    backgroundColor: '#F3F4F6',
  },
  tripStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tripOpenText: {
    color: '#1E40AF',
  },
  tripClosedText: {
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.muted,
  },
});
