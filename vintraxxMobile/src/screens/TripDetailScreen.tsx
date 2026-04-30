// TripDetailScreen — single trip with map polyline + KPIs.
//
// We render the polyline using the trip's optional `locations` array if the
// backend included it (some endpoints do, some don't). When absent we fall
// back to fetching `getLocationHistory(terminalId, since=startAt, until=endAt)`
// and decimating client-side for performance.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';

import { gpsApi } from '../services/gps/GpsApiService';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { GpsTripDetail, GpsLocation } from '../types/gps';

let MapView: any = null;
let Polyline: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  MapView = maps.default;
  Polyline = maps.Polyline;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch {
  /* no-op */
}

type TripDetailRoute = RouteProp<RootStackParamList, 'TripDetail'>;

interface PolylinePoint {
  latitude: number;
  longitude: number;
}

export const TripDetailScreen: React.FC = () => {
  const route = useRoute<TripDetailRoute>();
  const { terminalId, tripId } = route.params;

  const [trip, setTrip] = useState<GpsTripDetail | null>(null);
  const [points, setPoints] = useState<PolylinePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const detail = await gpsApi.getTrip(terminalId, tripId);
      if (cancelled) return;
      if (!detail.success || !detail.data) {
        logger.warn(LogCategory.APP, '[TripDetail] getTrip failed', {
          message: detail.message,
        });
        setLoading(false);
        return;
      }
      const t = detail.data.trip;
      setTrip(t);

      // Prefer backend-included locations; fall back to fetching history.
      let locs: PolylinePoint[] = [];
      if (t.locations && t.locations.length > 1) {
        locs = t.locations.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        }));
      } else {
        const since = t.startAt;
        const until = t.endAt ?? new Date().toISOString();
        const history = await gpsApi.getLocationHistory(terminalId, {
          since,
          until,
          limit: 1000,
        });
        if (history.success && history.data) {
          // History returns newest-first; reverse for chronological draw.
          locs = [...history.data.locations]
            .reverse()
            .map((l: GpsLocation) => ({ latitude: l.latitude, longitude: l.longitude }));
        }
      }
      setPoints(locs);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [terminalId, tripId]);

  const region = useMemo(() => {
    if (points.length === 0) return undefined;
    // Compute a bounding region tight to the polyline.
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    for (const p of points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.005, (maxLat - minLat) * 1.4),
      longitudeDelta: Math.max(0.005, (maxLng - minLng) * 1.4),
    };
  }, [points]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.loadingWrap}>
        <Text>Could not load trip.</Text>
      </View>
    );
  }

  const distanceMi = Number(trip.distanceKm ?? 0) * 0.621371;

  return (
    <View style={styles.root}>
      <View style={styles.mapWrap}>
        {MapView ? (
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={region}
          >
            {points.length > 1 && (
              <Polyline
                coordinates={points}
                strokeColor={colors.primary.navy}
                strokeWidth={4}
              />
            )}
            {trip.startLat != null && trip.startLng != null && (
              <Marker
                coordinate={{ latitude: Number(trip.startLat), longitude: Number(trip.startLng) }}
                title="Start"
                pinColor={colors.status.success}
              />
            )}
            {trip.endLat != null && trip.endLng != null && (
              <Marker
                coordinate={{ latitude: Number(trip.endLat), longitude: Number(trip.endLng) }}
                title="End"
                pinColor={colors.status.error}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackTitle}>Map not available</Text>
            <Text style={styles.mapFallbackBody}>
              Install `react-native-maps` to render trip routes.
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.statsContent}>
        <View style={styles.statRow}>
          <Stat label="Distance" value={`${distanceMi.toFixed(1)} mi`} />
          <Stat label="Duration" value={formatDuration(trip.durationSec ?? 0)} />
        </View>
        <View style={styles.statRow}>
          <Stat
            label="Max speed"
            value={`${Math.round((Number(trip.maxSpeedKmh) || 0) * 0.621371)} mph`}
          />
          <Stat
            label="Avg speed"
            value={`${Math.round((Number(trip.avgSpeedKmh) || 0) * 0.621371)} mph`}
          />
        </View>
        <View style={styles.statRow}>
          <Stat label="Harsh accel" value={String(trip.harshAccelCount)} />
          <Stat label="Harsh brake" value={String(trip.harshBrakeCount)} />
        </View>
        <View style={styles.statRow}>
          <Stat label="Overspeed" value={String(trip.overspeedCount)} />
          <Stat label="Score" value={trip.score != null ? String(trip.score) : '—'} />
        </View>
      </ScrollView>
    </View>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

function formatDuration(sec: number): string {
  if (!sec) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapWrap: { height: 280 },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  mapFallbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  mapFallbackBody: { fontSize: 12, color: colors.text.secondary },

  statsContent: { padding: spacing.screenHorizontal, paddingBottom: 120 },
  statRow: { flexDirection: 'row', marginBottom: 8 },
  stat: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: 4,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text.primary },
  statLabel: { fontSize: 11, color: colors.text.muted, marginTop: 2 },
});
