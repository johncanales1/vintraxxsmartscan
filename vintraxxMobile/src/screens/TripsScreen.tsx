// TripsScreen — list of GPS trips for a single terminal.
//
// Header summary card shows aggregate stats for the visible trips. The
// list itself is virtualised (FlatList) for fleets with thousands of
// historical trips.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { gpsApi } from '../services/gps/GpsApiService';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { GpsTrip } from '../types/gps';

type TripsRoute = RouteProp<RootStackParamList, 'Trips'>;

export const TripsScreen: React.FC = () => {
  const route = useRoute<TripsRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { terminalId } = route.params;

  const [trips, setTrips] = useState<GpsTrip[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const result = await gpsApi.listTrips(terminalId, { limit: 100 });
    if (!result.success || !result.data) {
      logger.warn(LogCategory.APP, '[Trips] listTrips failed', {
        message: result.message,
      });
      setLoading(false);
      return;
    }
    setTrips(result.data.trips);
    setLoading(false);
  }, [terminalId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const summary = useMemo(() => {
    const distance = trips.reduce((sum, t) => sum + (Number(t.distanceKm) || 0), 0);
    const maxSpeed = trips.reduce(
      (m, t) => Math.max(m, Number(t.maxSpeedKmh) || 0),
      0,
    );
    const idleSec = trips.reduce((sum, t) => sum + (t.idleDurationSec ?? 0), 0);
    return {
      count: trips.length,
      distanceMi: distance * 0.621371,
      maxSpeedMph: maxSpeed * 0.621371,
      idleSec,
    };
  }, [trips]);

  return (
    <View style={styles.root}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Recent activity</Text>
        <View style={styles.summaryRow}>
          <SummaryStat label="Trips" value={String(summary.count)} />
          <SummaryStat label="Distance" value={`${summary.distanceMi.toFixed(0)} mi`} />
          <SummaryStat label="Max speed" value={`${summary.maxSpeedMph.toFixed(0)} mph`} />
          <SummaryStat label="Idle" value={formatDuration(summary.idleSec)} />
        </View>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetch();
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No trips yet</Text>
              <Text style={styles.emptyBody}>
                Trips will appear here once the device starts driving.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TripRow
            trip={item}
            onPress={() =>
              navigation.navigate('TripDetail', { terminalId, tripId: item.id })
            }
          />
        )}
      />
    </View>
  );
};

const SummaryStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.summaryStat}>
    <Text style={styles.summaryStatValue}>{value}</Text>
    <Text style={styles.summaryStatLabel}>{label}</Text>
  </View>
);

const TripRow: React.FC<{ trip: GpsTrip; onPress: () => void }> = ({
  trip,
  onPress,
}) => {
  const start = new Date(trip.startAt);
  const end = trip.endAt ? new Date(trip.endAt) : null;
  const dist = Number(trip.distanceKm ?? 0) * 0.621371;
  const dur = trip.durationSec ?? 0;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>
          {start.toLocaleDateString()} · {start.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
          })}
          {end ? ` → ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ' (open)'}
        </Text>
        <Text style={styles.rowSubtitle}>
          {dist.toFixed(1)} mi · {formatDuration(dur)} ·{' '}
          {trip.score != null ? `Score ${trip.score}` : 'No score'}
        </Text>
      </View>
      <View
        style={[
          styles.statusPill,
          trip.status === 'OPEN' ? styles.statusPillOpen : styles.statusPillClosed,
        ]}
      >
        <Text style={styles.statusPillText}>
          {trip.status === 'OPEN' ? 'Open' : 'Closed'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

function formatDuration(sec: number): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: spacing.screenHorizontal,
    padding: spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.muted,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryStat: { alignItems: 'center', flex: 1 },
  summaryStatValue: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  summaryStatLabel: { fontSize: 11, color: colors.text.muted, marginTop: 2 },

  listContent: { paddingHorizontal: spacing.screenHorizontal, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  rowSubtitle: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillOpen: { backgroundColor: colors.status.warningLight },
  statusPillClosed: { backgroundColor: colors.status.successLight },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },

  empty: { paddingTop: 40, alignItems: 'center' },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 6,
  },
});
