// DtcEventsScreen — list of GPS-side DTC events for a single terminal.
//
// "GPS-side DTC" means DTCs the gateway captured from the always-on
// telematics box (separate from the BLE OBD scanner). Rows show the DTC
// code, system (powertrain/chassis/body/network), severity, when it was
// first seen, and whether it has been cleared.

import React, { useCallback, useEffect, useState } from 'react';
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
import type { GpsDtcEvent } from '../types/gps';

type DtcEventsRoute = RouteProp<RootStackParamList, 'DtcEvents'>;

export const DtcEventsScreen: React.FC = () => {
  const route = useRoute<DtcEventsRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // Route param is optional: when entered from a vehicle card we filter to
  // one terminal; when entered from History we list across the fleet.
  const terminalId = route.params?.terminalId;

  const [events, setEvents] = useState<GpsDtcEvent[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const result = await gpsApi.listDtcEvents({ terminalId, limit: 100 });
    if (!result.success || !result.data) {
      logger.warn(LogCategory.APP, '[DtcEvents] listDtcEvents failed', {
        message: result.message,
      });
      setLoading(false);
      return;
    }
    setEvents(result.data.events);
    setLoading(false);
  }, [terminalId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return (
    <View style={styles.root}>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
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
              <Text style={styles.emptyTitle}>No GPS-side DTC events</Text>
              <Text style={styles.emptyBody}>
                The always-on telematics gateway hasn't reported any diagnostic
                trouble codes yet. Use the Bluetooth scanner from the Scan tab
                for an on-demand read.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <DtcRow
            event={item}
            onPress={() =>
              navigation.navigate('DtcEventDetail', { dtcEventId: item.id })
            }
          />
        )}
      />
    </View>
  );
};

const DtcRow: React.FC<{ event: GpsDtcEvent; onPress: () => void }> = ({
  event,
  onPress,
}) => {
  // Severity heuristic: permanent codes are CRITICAL (cannot be cleared
  // by simple key cycle); MIL-on is WARNING; otherwise INFO.
  const severity =
    event.permanentDtcCodes.length > 0
      ? 'CRITICAL'
      : event.milOn
      ? 'WARNING'
      : 'INFO';
  const severityColor =
    severity === 'CRITICAL'
      ? colors.status.error
      : severity === 'WARNING'
      ? colors.status.warning
      : colors.status.info;

  const vehicle =
    event.terminal?.nickname ??
    [event.terminal?.vehicleYear, event.terminal?.vehicleMake, event.terminal?.vehicleModel]
      .filter(Boolean)
      .join(' ') ??
    'Unknown vehicle';

  const allCodes = [
    ...event.storedDtcCodes,
    ...event.pendingDtcCodes,
    ...event.permanentDtcCodes,
  ];
  const codePreview =
    allCodes.slice(0, 3).join(', ') + (allCodes.length > 3 ? '…' : '');

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {vehicle}
          {event.milOn ? ' · MIL on' : ''}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={2}>
          {event.dtcCount > 0
            ? `${event.dtcCount} code${event.dtcCount === 1 ? '' : 's'}: ${codePreview || '—'}`
            : 'No codes reported'}
        </Text>
        <Text style={styles.rowMeta}>
          {formatRelativeTime(event.reportedAt)}
          {event.protocol ? ` · ${event.protocol}` : ''}
          {event.mileageKm != null
            ? ` · ${Math.round(event.mileageKm * 0.621371)} mi`
            : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  listContent: { padding: spacing.screenHorizontal, paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
    marginTop: 5,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  rowSubtitle: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  rowMeta: { fontSize: 11, color: colors.text.muted, marginTop: 4 },

  empty: { paddingTop: 60, alignItems: 'center', paddingHorizontal: spacing.lg },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
