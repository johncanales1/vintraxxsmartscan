// GpsLiveMapTabScreen — Live Map tab for the GPS workflow.
//
// Google Maps with markers for all user terminals.
// Marker colors: green=ONLINE, red=OFFLINE, grey=NEVER_CONNECTED.
// Below map: scrollable terminal list with tap-to-pan.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppStore } from '../../store/appStore';
import { gpsApi } from '../../services/gps/GpsApiService';
import { gpsWs } from '../../services/gps/GpsWsClient';
import { logger, LogCategory } from '../../utils/Logger';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type { GpsTerminal, GpsLocation } from '../../types/gps';
import type { RootStackParamList } from '../../navigation/types';
import { TerminalCallout } from '../../components/TerminalCallout';
import { GOOGLE_MAPS_CONFIG } from '../../config/api';

import CarIcon from '../../assets/icons/car.svg';

// Dynamic map import — same pattern as LiveTrackScreen
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = undefined;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (err) {
  logger.warn(LogCategory.APP, '[GpsLiveMap] react-native-maps unavailable', err);
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const MAP_HEIGHT = Math.round(SCREEN_H * 0.45);

const MARKER_COLORS: Record<string, string> = {
  ONLINE: '#16A34A',
  OFFLINE: '#DC2626',
  NEVER_CONNECTED: '#9CA3AF',
  REVOKED: '#6B7280',
};

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
  return `${Math.floor(hrs / 24)}d ago`;
}

interface TerminalWithLocation {
  terminal: GpsTerminal;
  location: GpsLocation | null;
}

export const GpsLiveMapTabScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    gpsTerminals,
    setGpsTerminals,
    gpsLatestLocations,
    applyLocationUpdate,
  } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [latestLocations, setLatestLocations] = useState<Record<string, GpsLocation | null>>({});
  const mapRef = useRef<any>(null);

  // Fetch terminals on focus
  useFocusEffect(
    useCallback(() => {
      const fetch = async () => {
        setLoading(true);
        try {
          const result = await gpsApi.listTerminals();
          if (result.success && result.data) {
            setGpsTerminals((result.data as any).terminals ?? []);
          }
        } catch (err) {
          logger.error(LogCategory.GPS, 'Failed to fetch terminals for map', err);
        } finally {
          setLoading(false);
        }
      };
      fetch();
    }, [setGpsTerminals]),
  );

  // Fetch latest location for each terminal
  useEffect(() => {
    if (gpsTerminals.length === 0) return;
    let cancelled = false;
    const fetchLocations = async () => {
      const results = await Promise.allSettled(
        gpsTerminals.map(async (t) => {
          const res = await gpsApi.getLatestLocation(t.id);
          return { id: t.id, location: res.data ? (res.data as any).location : null };
        }),
      );
      if (cancelled) return;
      const next: Record<string, GpsLocation | null> = {};
      for (const r of results) {
        if (r.status === 'fulfilled') next[r.value.id] = r.value.location;
      }
      setLatestLocations(next);
    };
    fetchLocations();
    return () => { cancelled = true; };
  }, [gpsTerminals]);

  // WS live updates
  useEffect(() => {
    const off = gpsWs.on('location.update', (e: any) => {
      applyLocationUpdate(e);
      setLatestLocations((prev) => ({
        ...prev,
        [e.terminalId]: {
          id: `ws-${e.terminalId}-${e.data.reportedAt}`,
          terminalId: e.terminalId,
          reportedAt: e.data.reportedAt,
          serverReceivedAt: new Date().toISOString(),
          latitude: e.data.latitude,
          longitude: e.data.longitude,
          altitudeM: e.data.altitudeM,
          speedKmh: e.data.speedKmh,
          heading: e.data.heading,
          alarmBits: e.data.alarmBits ?? 0,
          statusBits: e.data.statusBits ?? 0,
          accOn: e.data.accOn,
          gpsFix: e.data.gpsFix,
          satelliteCount: null,
          signalStrength: null,
          odometerKm: null,
          fuelLevelPct: null,
          externalVoltageMv: null,
          batteryVoltageMv: null,
        },
      }));
    });
    return () => off();
  }, [applyLocationUpdate]);

  // Merge store-level latest with local fetched
  const mergedLocations = useMemo(() => {
    const merged = { ...latestLocations };
    for (const [tid, loc] of Object.entries(gpsLatestLocations)) {
      if (loc) merged[tid] = loc;
    }
    return merged;
  }, [latestLocations, gpsLatestLocations]);

  const located = useMemo(() => {
    return gpsTerminals
      .map((t): TerminalWithLocation | null => {
        const loc = mergedLocations[t.id];
        if (!loc || !loc.latitude || !loc.longitude) return null;
        return { terminal: t, location: loc };
      })
      .filter((x): x is TerminalWithLocation => x !== null);
  }, [gpsTerminals, mergedLocations]);

  const handlePanTo = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  }, []);

  const onlineCount = gpsTerminals.filter((t) => t.status === 'ONLINE').length;

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text style={styles.headerTitle}>Live Map</Text>
        <Text style={styles.headerSubtitle}>
          {located.length} of {gpsTerminals.length} on map · {onlineCount} online
        </Text>
      </SafeAreaView>

      {/* Map */}
      <View style={styles.mapContainer}>
        {!MapView ? (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>Map unavailable</Text>
            <Text style={styles.mapPlaceholderSub}>
              react-native-maps is not installed
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={colors.primary.navy} />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: located.length > 0 ? located[0].location!.latitude : 39.8283,
              longitude: located.length > 0 ? located[0].location!.longitude : -98.5795,
              latitudeDelta: located.length > 1 ? 20 : 0.05,
              longitudeDelta: located.length > 1 ? 20 : 0.05,
            }}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {located.map(({ terminal, location }) => (
              <Marker
                key={terminal.id}
                coordinate={{
                  latitude: location!.latitude,
                  longitude: location!.longitude,
                }}
                pinColor={MARKER_COLORS[terminal.status] ?? MARKER_COLORS.OFFLINE}
              >
                {Callout && (
                  <Callout
                    tooltip
                    onPress={() => navigation.navigate('LiveTrack', { terminalId: terminal.id })}
                  >
                    <TerminalCallout terminal={terminal} location={location} />
                  </Callout>
                )}
              </Marker>
            ))}
          </MapView>
        )}
      </View>

      {/* Terminal list below map */}
      <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
        <Text style={styles.listTitle}>Fleet</Text>
        {gpsTerminals.map((t) => {
          const loc = mergedLocations[t.id];
          const statusColor = MARKER_COLORS[t.status] ?? MARKER_COLORS.OFFLINE;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.listItem}
              onPress={() => {
                if (loc) handlePanTo(loc.latitude, loc.longitude);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.listDot, { backgroundColor: statusColor }]} />
              <View style={styles.listItemText}>
                <Text style={styles.listItemTitle} numberOfLines={1}>
                  {vehicleLabel(t)}
                </Text>
                <Text style={styles.listItemSub}>
                  {t.status === 'ONLINE' ? 'Online' : t.status === 'OFFLINE' ? 'Offline' : 'Never connected'}
                  {' · '}
                  {formatRelative(t.lastHeartbeatAt)}
                </Text>
              </View>
              {loc && (
                <Text style={styles.listItemCoords}>
                  {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

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
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: '#E5E7EB',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  mapPlaceholderSub: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  listDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  listItemSub: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  listItemCoords: {
    fontSize: 10,
    color: colors.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
