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

type AlertsRoute = RouteProp<RootStackParamList, 'Alerts'>;
type Tab = 'active' | 'all' | 'acknowledged';
type SeverityFilter = 'all' | GpsAlarmSeverity;
type PeriodFilter = '24h' | '7d' | '30d';
const PERIOD_MS: Record<PeriodFilter, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

export const AlertsScreen: React.FC = () => {
  const route = useRoute<AlertsRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const terminalId = route.params?.terminalId;

  const { gpsAlarms, setGpsAlarms, addGpsAlarm, updateGpsAlarm } = useAppStore();
  const [tab, setTab] = useState<Tab>('active');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [acking, setAcking] = useState(false);

  const sinceIso = useMemo(
    () => new Date(Date.now() - PERIOD_MS[period]).toISOString(),
    [period],
  );

  const fetch = useCallback(async () => {
    const result = await gpsApi.listAlarms({
      terminalId,
      since: sinceIso,
      limit: 200,
    });
    if (!result.success || !result.data) {
      logger.warn(LogCategory.APP, '[Alerts] listAlarms failed', {
        message: result.message,
      });
      return;
    }
    setGpsAlarms(result.data.alarms);
  }, [terminalId, sinceIso, setGpsAlarms]);

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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onBulkAck = async () => {
    if (selected.size === 0) return;
    setAcking(true);
    const ids = Array.from(selected);
    const concurrency = 5;
    for (let i = 0; i < ids.length; i += concurrency) {
      const batch = ids.slice(i, i + concurrency);
      await Promise.all(batch.map((id) => gpsApi.ackAlarm(id)));
    }
    // Optimistic update in store
    for (const id of ids) {
      updateGpsAlarm(id, { acknowledged: true, acknowledgedAt: new Date().toISOString() });
    }
    setAcking(false);
    setSelected(new Set());
    void fetch();
  };

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

      {/* Period filter */}
      <View style={styles.chipRow}>
        {(['24h', '7d', '30d'] as PeriodFilter[]).map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriod(p)}
            style={[styles.chip, period === p && styles.chipActive]}
          >
            <Text style={[styles.chipLabel, period === p && styles.chipLabelActive]}>
              {p}
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

      {/* Bulk-acknowledge bar */}
      {selected.size > 0 && (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkBarText}>{selected.size} selected</Text>
          <TouchableOpacity
            style={[styles.bulkAckBtn, acking && styles.bulkAckBtnDisabled]}
            onPress={onBulkAck}
            disabled={acking}
          >
            <Text style={styles.bulkAckBtnText}>
              {acking ? 'Acknowledging…' : 'Acknowledge'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(new Set())}>
            <Text style={styles.bulkClearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

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
            selected={selected.has(item.id)}
            onToggle={() => toggleSelect(item.id)}
            onPress={() => navigation.navigate('AlertDetail', { alarmId: item.id })}
          />
        )}
      />
    </View>
  );
};

const AlertRow: React.FC<{
  alarm: GpsAlarm;
  selected: boolean;
  onToggle: () => void;
  onPress: () => void;
}> = ({ alarm, selected, onToggle, onPress }) => {
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

  const stateLabel = alarm.acknowledged
    ? 'Acknowledged'
    : alarm.closedAt
    ? 'Closed'
    : 'Open';
  const stateStyle = alarm.acknowledged
    ? styles.statePillAck
    : alarm.closedAt
    ? styles.statePillClosed
    : styles.statePillOpen;
  const stateTextStyle = alarm.acknowledged
    ? styles.statePillAckText
    : alarm.closedAt
    ? styles.statePillClosedText
    : styles.statePillOpenText;

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onToggle} hitSlop={8} style={styles.selectCircleWrap}>
        <View style={[styles.selectCircle, selected && styles.selectCircleActive]} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.rowContent}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={[styles.severityDot, { backgroundColor: dotColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {humanise(alarm.type)}
          </Text>
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {vehicle} · {formatRelativeTime(alarm.openedAt)}
          </Text>
        </View>
        <View style={[styles.statePill, stateStyle]}>
          <Text style={[styles.statePillText, stateTextStyle]}>{stateLabel}</Text>
        </View>
      </TouchableOpacity>
    </View>
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
    paddingVertical: 4,
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

  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    marginHorizontal: spacing.screenHorizontal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  bulkBarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, flex: 1 },
  bulkAckBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 10,
  },
  bulkAckBtnDisabled: { opacity: 0.5 },
  bulkAckBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  bulkClearText: { color: '#94A3B8', fontWeight: '600', fontSize: 12 },

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
  selectCircleWrap: { marginRight: 10 },
  selectCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  selectCircleActive: {
    backgroundColor: colors.primary.navy,
    borderColor: colors.primary.navy,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.text.primary },
  rowSubtitle: { fontSize: 12, color: colors.text.muted, marginTop: 2 },

  statePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 8,
  },
  statePillText: { fontSize: 10, fontWeight: '700' },
  statePillOpen: { backgroundColor: '#FEE2E2' },
  statePillOpenText: { color: '#B91C1C' },
  statePillClosed: { backgroundColor: '#F1F5F9' },
  statePillClosedText: { color: '#64748B' },
  statePillAck: { backgroundColor: '#D1FAE5' },
  statePillAckText: { color: '#065F46' },

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
