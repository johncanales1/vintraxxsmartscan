// LiveTrackScreen — full-screen live tracking for one GPS terminal.
//
// Layout (per Option B spec):
//   • Top 60% — `react-native-maps` Google MapView with the vehicle marker
//     (heading-rotated) and a trailing breadcrumb polyline from the last
//     N minutes (default 30).
//   • Bottom 40% — draggable bottom sheet with three snap points:
//       Peek  — single KPI row.
//       Half  — segmented Live OBD / Status / Alerts.
//       Full  — same content, scrollable.
//   • Top overlay — back chevron, vehicle label, status dots
//     (online + signal strength + ACC), settings gear.
//   • Connection-state banner — Live / Reconnecting… / Offline.
//
// Realtime feed:
//   On mount we subscribe the WS client to `terminal:<id>`; updates fan out
//   into `applyLocationUpdate` on the store, which keeps the marker fresh.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppStore } from '../store/appStore';
import { gpsApi } from '../services/gps/GpsApiService';
import { gpsWs, GpsWsState } from '../services/gps/GpsWsClient';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { GpsAlarm, GpsLocation } from '../types/gps';

import CarIcon from '../assets/icons/car.svg';
import WarningIcon from '../assets/icons/warning.svg';
import ToolIcon from '../assets/icons/tool.svg';
import CloseIcon from '../assets/icons/close.svg';

// We require the map dynamically: this screen is the ONLY consumer of
// react-native-maps so a missing native build (e.g. Metro bundling on a
// developer machine without the map module installed) only affects this
// screen, not the rest of the app.
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (err) {
  // Logged once; the screen renders a friendly "map unavailable" state.
  logger.warn(LogCategory.APP, '[LiveTrack] react-native-maps unavailable', err);
}

type LiveTrackRoute = RouteProp<RootStackParamList, 'LiveTrack'>;

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_PEEK = 100;
const SHEET_HALF = Math.round(SCREEN_H * 0.45);
const SHEET_FULL = Math.round(SCREEN_H * 0.85);
const TRAIL_MINUTES = 30;

export const LiveTrackScreen: React.FC = () => {
  const route = useRoute<LiveTrackRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { terminalId } = route.params;

  const {
    gpsTerminals,
    upsertGpsTerminal,
    gpsLatestLocations,
    setGpsLatestLocation,
    applyLocationUpdate,
    gpsAlarms,
    addGpsAlarm,
  } = useAppStore();

  const terminal = gpsTerminals.find((t) => t.id === terminalId);
  const latest = gpsLatestLocations[terminalId];
  const [trail, setTrail] = useState<GpsLocation[]>([]);
  const [wsState, setWsState] = useState<GpsWsState>(gpsWs.getState());
  const [tab, setTab] = useState<'obd' | 'status' | 'alerts'>('obd');
  const [loading, setLoading] = useState(true);

  // Bottom-sheet animation — uses Animated.Value + PanResponder. A full
  // gesture-handler bottom sheet is overkill here; the spec calls for 3
  // discrete snap points and that's straightforward to do by hand.
  const sheetY = useRef(new Animated.Value(SCREEN_H - SHEET_HALF)).current;
  const sheetSnap = useRef<'peek' | 'half' | 'full'>('half');
  const animateTo = (snap: 'peek' | 'half' | 'full') => {
    sheetSnap.current = snap;
    const target =
      snap === 'peek'
        ? SCREEN_H - SHEET_PEEK
        : snap === 'half'
        ? SCREEN_H - SHEET_HALF
        : SCREEN_H - SHEET_FULL;
    Animated.spring(sheetY, {
      toValue: target,
      tension: 180,
      friction: 22,
      useNativeDriver: false,
    }).start();
  };
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 6,
      onPanResponderMove: (_e, g) => {
        const base =
          sheetSnap.current === 'peek'
            ? SCREEN_H - SHEET_PEEK
            : sheetSnap.current === 'half'
            ? SCREEN_H - SHEET_HALF
            : SCREEN_H - SHEET_FULL;
        const next = Math.max(SCREEN_H - SHEET_FULL, Math.min(SCREEN_H - SHEET_PEEK, base + g.dy));
        sheetY.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        // Pick nearest snap.
        const top = SCREEN_H - SHEET_FULL;
        const mid = SCREEN_H - SHEET_HALF;
        const bot = SCREEN_H - SHEET_PEEK;
        const current =
          sheetSnap.current === 'peek' ? bot : sheetSnap.current === 'half' ? mid : top;
        const target = current + g.dy;
        const choices: Array<['peek' | 'half' | 'full', number]> = [
          ['peek', bot],
          ['half', mid],
          ['full', top],
        ];
        let best: 'peek' | 'half' | 'full' = 'half';
        let bestDist = Infinity;
        for (const [name, y] of choices) {
          const d = Math.abs(y - target);
          if (d < bestDist) {
            bestDist = d;
            best = name;
          }
        }
        animateTo(best);
      },
    }),
  ).current;

  // Initial fetch: terminal detail (so the header has fresh data) + latest
  // location + a 30-minute breadcrumb trail.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [detail, latestRes, history] = await Promise.all([
        gpsApi.getTerminal(terminalId),
        gpsApi.getLatestLocation(terminalId),
        gpsApi.getLocationHistory(terminalId, {
          since: new Date(Date.now() - TRAIL_MINUTES * 60_000).toISOString(),
          limit: 200,
        }),
      ]);
      if (cancelled) return;
      if (detail.success && detail.data) upsertGpsTerminal(detail.data.terminal);
      if (latestRes.success && latestRes.data?.location) {
        setGpsLatestLocation(terminalId, latestRes.data.location);
      }
      if (history.success && history.data) {
        // Locations come back newest-first; reverse for polyline drawing.
        setTrail([...history.data.locations].reverse());
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [terminalId, upsertGpsTerminal, setGpsLatestLocation]);

  // WS subscription for live updates scoped to this terminal.
  useEffect(() => {
    gpsWs.subscribeToTerminal(terminalId);
    const offState = gpsWs.on('state', setWsState);
    const offLoc = gpsWs.on('location.update', (event) => {
      if (event.terminalId !== terminalId) return;
      applyLocationUpdate(event);
      setTrail((prev) => {
        // Keep last ~200 points of trail; mirror the synthesized location
        // shape used by the store so renderers stay simple.
        const next: GpsLocation = {
          id: `ws-${event.terminalId}-${event.data.reportedAt}`,
          terminalId: event.terminalId,
          reportedAt: event.data.reportedAt,
          serverReceivedAt: new Date().toISOString(),
          latitude: event.data.latitude,
          longitude: event.data.longitude,
          altitudeM: event.data.altitudeM,
          speedKmh: event.data.speedKmh,
          heading: event.data.heading,
          alarmBits: event.data.alarmBits,
          statusBits: event.data.statusBits,
          accOn: event.data.accOn,
          gpsFix: event.data.gpsFix,
          satelliteCount: null,
          signalStrength: null,
          odometerKm: null,
          fuelLevelPct: null,
          externalVoltageMv: null,
          batteryVoltageMv: null,
        };
        const merged = [...prev, next];
        return merged.length > 200 ? merged.slice(merged.length - 200) : merged;
      });
    });
    const offAlarm = gpsWs.on('alarm.opened', (event) => {
      if (event.terminalId !== terminalId) return;
      // Hydrate to the full alarm row asynchronously; fire-and-forget so
      // we don't block the UI.
      void gpsApi.getAlarm(event.alarmId).then((res) => {
        if (res.success && res.data) addGpsAlarm(res.data.alarm);
      });
    });
    return () => {
      gpsWs.unsubscribeFromTerminal(terminalId);
      offState();
      offLoc();
      offAlarm();
    };
  }, [terminalId, applyLocationUpdate, addGpsAlarm]);

  const onRequestLocate = async () => {
    const result = await gpsApi.requestLocate(terminalId);
    if (result.success) {
      Alert.alert('Locate requested', 'Waiting for the device to reply…');
    } else {
      Alert.alert('Could not request locate', result.message ?? 'Try again later.');
    }
  };

  const terminalAlarms = useMemo(
    () => gpsAlarms.filter((a) => a.terminalId === terminalId).slice(0, 5),
    [gpsAlarms, terminalId],
  );

  // Bug #L1: separate "still loading" from "loaded but the terminal is no
  // longer in the user's fleet" (deleted, transferred, or stale deep link).
  // Previously a loaded-but-missing terminal caused the screen to render
  // with empty data instead of a friendly empty state.
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
      </View>
    );
  }
  if (!terminal) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.notFoundTitle}>Vehicle not available</Text>
        <Text style={styles.notFoundBody}>
          This GPS vehicle is no longer in your fleet, or you don't have access
          to it. Pull down on the Devices tab to refresh.
        </Text>
        <TouchableOpacity
          style={styles.notFoundButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.notFoundButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback identifier prefers the canonical device identifier (always
  // populated), falls back to IMEI metadata when available.
  const fallbackId = terminal?.deviceIdentifier ?? terminal?.imei ?? '';
  const fallbackTail = fallbackId.slice(-6);
  const vehicleLabel =
    terminal?.nickname ||
    [terminal?.vehicleYear, terminal?.vehicleMake, terminal?.vehicleModel]
      .filter(Boolean)
      .join(' ') ||
    (fallbackTail ? `Device ${fallbackTail}` : 'Device');
  const online = terminal?.status === 'ONLINE';

  return (
    <View style={styles.root}>
      {/* Map */}
      {MapView ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          showsUserLocation={false}
          showsCompass
          rotateEnabled
          initialRegion={
            latest
              ? {
                  latitude: latest.latitude,
                  longitude: latest.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                }
              : undefined
          }
        >
          {trail.length > 1 && (
            <Polyline
              coordinates={trail.map((p) => ({
                latitude: p.latitude,
                longitude: p.longitude,
              }))}
              strokeColor={colors.primary.navy}
              strokeWidth={4}
            />
          )}
          {latest && (
            <Marker
              coordinate={{ latitude: latest.latitude, longitude: latest.longitude }}
              rotation={latest.heading ?? 0}
              flat
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.vehicleMarker}>
                <CarIcon width={20} height={20} color="#FFFFFF" />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.mapFallback]}>
          <Text style={styles.mapFallbackTitle}>Map not available</Text>
          <Text style={styles.mapFallbackBody}>
            Build the app with `react-native-maps` to enable live tracking.
          </Text>
        </View>
      )}

      {/* Top overlay */}
      <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
            hitSlop={12}
            accessibilityLabel="Back"
          >
            <CloseIcon width={18} height={18} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topTitleWrap}>
            <Text style={styles.topTitle} numberOfLines={1}>
              {vehicleLabel}
            </Text>
            <View style={styles.topStatusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: online ? colors.status.success : colors.text.muted },
                ]}
              />
              <Text style={styles.topStatusText}>
                {online ? 'Online' : 'Offline'} · ACC {latest?.accOn ? 'On' : 'Off'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('DeviceSettings', { terminalId })}
            hitSlop={12}
            accessibilityLabel="Settings"
          >
            <ToolIcon width={18} height={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Connection-state banner */}
        <View style={styles.connBanner}>
          <View
            style={[
              styles.connBannerDot,
              wsState === 'open'
                ? styles.connBannerDotLive
                : wsState === 'connecting'
                ? styles.connBannerDotReconnecting
                : styles.connBannerDotOffline,
            ]}
          />
          <Text style={styles.connBannerText}>
            {wsState === 'open'
              ? 'Live'
              : wsState === 'connecting'
              ? 'Reconnecting…'
              : `Offline${latest ? ` (data is up to ${formatTime(latest.reportedAt)})` : ''}`}
          </Text>
        </View>
      </SafeAreaView>

      {/* Bottom sheet */}
      <Animated.View
        style={[styles.sheet, { top: sheetY }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.sheetGrabber} />

        {/* Peek row — always visible. */}
        <View style={styles.peekRow}>
          <PeekKpi label="Speed" value={formatSpeedMph(latest?.speedKmh)} />
          <PeekKpi label="Coolant" value="—°C" />
          <PeekKpi
            label="Fuel"
            value={latest?.fuelLevelPct != null ? `${Math.round(latest.fuelLevelPct)}%` : '—'}
          />
          <PeekKpi
            label="Batt"
            value={
              latest?.externalVoltageMv != null
                ? `${(latest.externalVoltageMv / 1000).toFixed(1)} V`
                : '—'
            }
          />
          <PeekKpi label="MIL" value={(latest?.alarmBits ?? 0) > 0 ? 'ON' : 'OFF'} />
        </View>

        {/* Half / Full content */}
        <View style={styles.sheetTabs}>
          <SheetTab label="Live OBD" active={tab === 'obd'} onPress={() => setTab('obd')} />
          <SheetTab label="Status" active={tab === 'status'} onPress={() => setTab('status')} />
          <SheetTab label="Alerts" active={tab === 'alerts'} onPress={() => setTab('alerts')} />
        </View>

        <ScrollView
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'obd' && <LiveObdGrid latest={latest} />}
          {tab === 'status' && <StatusGrid latest={latest} />}
          {tab === 'alerts' && (
            <AlertsList
              alarms={terminalAlarms}
              onSelect={(a) => navigation.navigate('AlertDetail', { alarmId: a.id })}
              onSeeAll={() => navigation.navigate('Alerts', { terminalId })}
            />
          )}
        </ScrollView>

        <View style={styles.sheetActions}>
          <TouchableOpacity style={styles.sheetActionBtn} onPress={onRequestLocate}>
            <Text style={styles.sheetActionText}>Request live position</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sheetActionBtn, styles.sheetActionGhost]}
            onPress={() => navigation.navigate('Trips', { terminalId })}
          >
            <Text style={[styles.sheetActionText, styles.sheetActionTextGhost]}>
              View trips
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

// ── Sheet sub-components ────────────────────────────────────────────────

const PeekKpi: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.peekKpi}>
    <Text style={styles.peekKpiValue}>{value}</Text>
    <Text style={styles.peekKpiLabel}>{label}</Text>
  </View>
);

const SheetTab: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.sheetTab, active && styles.sheetTabActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.sheetTabLabel, active && styles.sheetTabLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const LiveObdGrid: React.FC<{ latest: GpsLocation | undefined }> = ({ latest }) => (
  <View style={styles.kpiGrid}>
    <KpiCard label="Speed" value={formatSpeedMph(latest?.speedKmh)} />
    <KpiCard label="Heading" value={latest?.heading != null ? `${latest.heading}°` : '—'} />
    <KpiCard
      label="Altitude"
      value={latest?.altitudeM != null ? `${latest.altitudeM} m` : '—'}
    />
    <KpiCard
      label="Battery"
      value={
        latest?.batteryVoltageMv != null
          ? `${(latest.batteryVoltageMv / 1000).toFixed(1)} V`
          : '—'
      }
    />
    <KpiCard
      label="External"
      value={
        latest?.externalVoltageMv != null
          ? `${(latest.externalVoltageMv / 1000).toFixed(1)} V`
          : '—'
      }
    />
    <KpiCard
      label="Fuel"
      value={latest?.fuelLevelPct != null ? `${Math.round(latest.fuelLevelPct)}%` : '—'}
    />
    <KpiCard
      label="Odometer"
      value={latest?.odometerKm != null ? `${Math.round(latest.odometerKm)} km` : '—'}
    />
    <KpiCard
      label="Satellites"
      value={latest?.satelliteCount != null ? String(latest.satelliteCount) : '—'}
    />
  </View>
);

const StatusGrid: React.FC<{ latest: GpsLocation | undefined }> = ({ latest }) => {
  const status = latest?.statusBits ?? 0;
  const items: Array<{ label: string; on: boolean }> = [
    { label: 'ACC', on: !!latest?.accOn },
    { label: 'GPS Fix', on: !!latest?.gpsFix },
    { label: 'Engine', on: bit(status, 0) },
    { label: 'Latched', on: bit(status, 1) },
    { label: 'Charging', on: bit(status, 2) },
    { label: 'Braking', on: bit(status, 3) },
    { label: 'Left signal', on: bit(status, 4) },
    { label: 'Right signal', on: bit(status, 5) },
  ];
  return (
    <View style={styles.statusGrid}>
      {items.map((it) => (
        <View key={it.label} style={styles.statusCell}>
          <View
            style={[
              styles.statusCellDot,
              { backgroundColor: it.on ? colors.status.success : colors.text.muted },
            ]}
          />
          <Text style={styles.statusCellLabel}>{it.label}</Text>
          <Text style={styles.statusCellValue}>{it.on ? 'On' : 'Off'}</Text>
        </View>
      ))}
    </View>
  );
};

const AlertsList: React.FC<{
  alarms: GpsAlarm[];
  onSelect: (a: GpsAlarm) => void;
  onSeeAll: () => void;
}> = ({ alarms, onSelect, onSeeAll }) => {
  if (alarms.length === 0) {
    return (
      <View style={styles.alertsEmpty}>
        <Text style={styles.alertsEmptyText}>No recent alerts on this vehicle.</Text>
      </View>
    );
  }
  return (
    <View>
      {alarms.map((a) => (
        <TouchableOpacity
          key={a.id}
          style={styles.alertRow}
          onPress={() => onSelect(a)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.alertSeverityDot,
              {
                backgroundColor:
                  a.severity === 'CRITICAL'
                    ? colors.status.error
                    : a.severity === 'WARNING'
                    ? colors.status.warning
                    : colors.status.info,
              },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle} numberOfLines={1}>
              {humaniseAlarmType(a.type)}
            </Text>
            <Text style={styles.alertSubtitle} numberOfLines={1}>
              {formatRelativeTime(a.openedAt)}
            </Text>
          </View>
          <WarningIcon width={16} height={16} color={colors.text.muted} />
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={onSeeAll} style={styles.alertSeeAll}>
        <Text style={styles.alertSeeAllText}>See all alerts →</Text>
      </TouchableOpacity>
    </View>
  );
};

const KpiCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.kpiCard}>
    <Text style={styles.kpiCardValue}>{value}</Text>
    <Text style={styles.kpiCardLabel}>{label}</Text>
  </View>
);

// ── Helpers ─────────────────────────────────────────────────────────────

function bit(v: number, n: number): boolean {
  return (v & (1 << n)) !== 0;
}

function formatSpeedMph(kmh: number | null | undefined): string {
  if (kmh === null || kmh === undefined) return '—';
  return `${Math.round(Number(kmh) * 0.621371)} mph`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString();
}

function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function humaniseAlarmType(t: string): string {
  return t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  // Bug #L1 styles: friendly empty state when the terminalId is no longer
  // resolvable (deleted, transferred, or a stale deep-link).
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  notFoundBody: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  notFoundButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.primary.navy,
  },
  notFoundButtonText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
  mapFallback: {
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  mapFallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  mapFallbackBody: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  vehicleMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleWrap: { flex: 1, marginHorizontal: spacing.sm },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  topStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  topStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },

  connBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 4,
  },
  connBannerDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  connBannerDotLive: { backgroundColor: colors.status.success },
  connBannerDotReconnecting: { backgroundColor: colors.status.warning },
  connBannerDotOffline: { backgroundColor: colors.text.light },
  connBannerText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SHEET_FULL,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 },
    elevation: 16,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: 8,
  },
  peekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  peekKpi: { alignItems: 'center', flex: 1 },
  peekKpiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  peekKpiLabel: { fontSize: 10, color: colors.text.muted, marginTop: 2 },

  sheetTabs: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 4,
  },
  sheetTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  sheetTabActive: { backgroundColor: '#FFFFFF' },
  sheetTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  sheetTabLabelActive: { color: colors.primary.navy, fontWeight: '700' },

  sheetContent: { paddingTop: spacing.md, paddingBottom: spacing.lg },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  kpiCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  kpiCardLabel: { fontSize: 11, color: colors.text.muted, marginTop: 2 },

  statusGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statusCell: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusCellDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusCellLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  statusCellValue: { fontSize: 12, color: colors.text.secondary },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  alertSeverityDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  alertSubtitle: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  alertSeeAll: { paddingTop: 12, alignItems: 'flex-end' },
  alertSeeAllText: {
    color: colors.primary.navy,
    fontWeight: '700',
    fontSize: 13,
  },
  alertsEmpty: { paddingVertical: 24, alignItems: 'center' },
  alertsEmptyText: { color: colors.text.muted },

  sheetActions: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
  },
  sheetActionBtn: {
    flex: 1,
    backgroundColor: colors.primary.navy,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  sheetActionGhost: {
    backgroundColor: '#F1F5F9',
  },
  sheetActionText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  sheetActionTextGhost: { color: colors.primary.navy },
});

// Silence unused-import warnings in builds where the icon transformer
// strips out files we still want for future drop-ins.
void Platform;
