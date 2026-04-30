// AlertsScreen — list of GPS alarms across the user's fleet.
//
// Header: tabs `Active · All · Acknowledged`. Filter chips for severity.
// List rows: severity dot + alarm title + vehicle nickname + relative time.
//
// Live updates: WS `alarm.opened` events append to the in-memory list (the
// server-truth refresh happens on pull-to-refresh).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppStore } from '../store/appStore';
import { gpsApi } from '../services/gps/GpsApiService';
import { gpsWs } from '../services/gps/GpsWsClient';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { GpsAlarm, GpsAlarmSeverity } from '../types/gps';

import WarningIcon from '../assets/icons/warning.svg';

type AlertsRoute = RouteProp<RootStackParamList, 'Alerts'>;
type Tab = 'active' | 'all' | 'acknowledged';
type SeverityFilter = 'all' | GpsAlarmSeverity;

export const AlertsScreen: React.FC = () => {
  const route = useRoute<AlertsRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const terminalId = route.params?.terminalId;

  const { gpsAlarms, setGpsAlarms, addGpsAlarm } = useAppStore();
  const [tab, setTab] = useState<Tab>('active');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    const result = await gpsApi.listAlarms({
      terminalId,
      limit: 100,
    });
    if (!result.success || !result.data) {
      logger.warn(LogCategory.APP, '[Alerts] listAlarms failed', {
        message: result.message,
      });
      return;
    }
    setGpsAlarms(result.data.alarms);
  }, [terminalId, setGpsAlarms]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  // WS append-on-open. Hydrate the full alarm row to keep the list consistent
  // with the server-side shape (severity, openedAt, locationId, …).
  useEffect(() => {
    const off = gpsWs.on('alarm.opened', (event) => {
      if (terminalId && event.terminalId !== terminalId) return;
      void gpsApi.getAlarm(event.alarmId).then((res) => {
        if (res.success && res.data) addGpsAlarm(res.data.alarm);
      });
    });
    return off;
  }, [terminalId, addGpsAlarm]);

  const visible = useMemo(() => {
    let list = terminalId
      ? gpsAlarms.filter((a) => a.terminalId === terminalId)
      : gpsAlarms;
    if (tab === 'active') {
      list = list.filter((a) => !a.closedAt && !a.acknowledged);
    } else if (tab === 'acknowledged') {
      list = list.filter((a) => a.acknowledged);
    }
    if (severity !== 'all') list = list.filter((a) => a.severity === severity);
    return list.slice().sort((a, b) => +new Date(b.openedAt) - +new Date(a.openedAt));
  }, [gpsAlarms, terminalId, tab, severity]);

  return (
    <View style={styles.root}>
      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['active', 'all', 'acknowledged'] as Tab[]).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
              {t === 'active' ? 'Active' : t === 'all' ? 'All' : 'Acknowledged'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Severity filter */}
      <View style={styles.chipRow}>
        {(['all', 'CRITICAL', 'WARNING', 'INFO'] as SeverityFilter[]).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setSeverity(s)}
            style={[styles.chip, severity === s && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, severity === s && styles.chipLabelActive]}>
              {s === 'all' ? 'All severities' : s.charAt(0) + s.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(a) => a.id}
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
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No alerts</Text>
            <Text style={styles.emptyBody}>
              {tab === 'active'
                ? 'You have no active alerts. Pull to refresh.'
                : 'Nothing here yet.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <AlertRow
            alarm={item}
            onPress={() => navigation.navigate('AlertDetail', { alarmId: item.id })}
          />
        )}
      />
    </View>
  );
};

const AlertRow: React.FC<{ alarm: GpsAlarm; onPress: () => void }> = ({
  alarm,
  onPress,
}) => {
  const dotColor =
    alarm.severity === 'CRITICAL'
      ? colors.status.error
      : alarm.severity === 'WARNING'
      ? colors.status.warning
      : colors.status.info;
  const vehicle =
    alarm.terminal?.nickname ??
    [alarm.terminal?.vehicleYear, alarm.terminal?.vehicleMake, alarm.terminal?.vehicleModel]
      .filter(Boolean)
      .join(' ') ??
    'Unknown vehicle';
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.severityDot, { backgroundColor: dotColor }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {humanise(alarm.type)}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {vehicle} · {formatRelativeTime(alarm.openedAt)}
          {alarm.acknowledged ? ' · acknowledged' : ''}
        </Text>
      </View>
      <WarningIcon width={16} height={16} color={colors.text.muted} />
    </TouchableOpacity>
  );
};

function humanise(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

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

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: { borderBottomColor: colors.primary.navy },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabLabelActive: { color: colors.primary.navy, fontWeight: '700' },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: { backgroundColor: colors.primary.navy },
  chipLabel: { fontSize: 12, color: colors.text.secondary, fontWeight: '600' },
  chipLabelActive: { color: '#FFFFFF', fontWeight: '700' },

  listContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  rowSubtitle: { fontSize: 12, color: colors.text.muted, marginTop: 2 },

  empty: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
