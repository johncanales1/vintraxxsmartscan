// AlertDetailScreen — single GPS alarm view + acknowledge action.
//
// Shows: severity chip, time, full alarm type, terminal label, location
// snapshot (small map preview when react-native-maps is available),
// raw extraData JSON (collapsed, dev-only).
//
// Actions: Acknowledge (with optional note via simple Alert.prompt-like
// fallback), View Vehicle Live, Create Service Appointment (deep-links
// Schedule pre-filled with VIN + reason).

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppStore } from '../store/appStore';
import { gpsApi } from '../services/gps/GpsApiService';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { GpsAlarm } from '../types/gps';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch {
  /* no-op */
}

type AlertDetailRoute = RouteProp<RootStackParamList, 'AlertDetail'>;

export const AlertDetailScreen: React.FC = () => {
  const route = useRoute<AlertDetailRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { alarmId } = route.params;
  const { gpsAlarms, addGpsAlarm, updateGpsAlarm, gpsTerminals } = useAppStore();

  // Optimistic: read from cache while we re-fetch.
  const cached = gpsAlarms.find((a) => a.id === alarmId);
  const [alarm, setAlarm] = useState<GpsAlarm | null>(cached ?? null);
  const [loading, setLoading] = useState(!cached);
  const [ackNote, setAckNote] = useState('');
  const [acking, setAcking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await gpsApi.getAlarm(alarmId);
      if (cancelled) return;
      if (result.success && result.data) {
        setAlarm(result.data.alarm);
        addGpsAlarm(result.data.alarm); // cache it
      } else {
        logger.warn(LogCategory.APP, '[AlertDetail] getAlarm failed', {
          message: result.message,
        });
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [alarmId, addGpsAlarm]);

  if (loading || !alarm) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
      </View>
    );
  }

  const terminal = gpsTerminals.find((t) => t.id === alarm.terminalId);
  const vehicle =
    terminal?.nickname ??
    [terminal?.vehicleYear, terminal?.vehicleMake, terminal?.vehicleModel]
      .filter(Boolean)
      .join(' ') ??
    'Unknown vehicle';
  const dotColor =
    alarm.severity === 'CRITICAL'
      ? colors.status.error
      : alarm.severity === 'WARNING'
      ? colors.status.warning
      : colors.status.info;

  const onAck = async () => {
    setAcking(true);
    const result = await gpsApi.ackAlarm(alarmId, ackNote.trim() || undefined);
    setAcking(false);
    if (result.success && result.data) {
      updateGpsAlarm(alarmId, result.data.alarm);
      setAlarm(result.data.alarm);
      Alert.alert('Acknowledged', 'This alert is now acknowledged.');
    } else {
      Alert.alert('Could not acknowledge', result.message ?? 'Try again later.');
    }
  };

  const onCreateAppointment = () => {
    navigation.navigate('Main', {
      screen: 'Schedule',
      params: {
        vin: terminal?.vehicleVin ?? undefined,
        vehicle,
        additionalNotes: `Auto-created from GPS alert: ${humanise(alarm.type)} at ${new Date(
          alarm.openedAt,
        ).toLocaleString()}.`,
      },
    });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={[styles.severityChip, { backgroundColor: dotColor }]}>
        <Text style={styles.severityChipText}>{alarm.severity}</Text>
      </View>
      <Text style={styles.title}>{humanise(alarm.type)}</Text>
      <Text style={styles.subtitle}>
        {vehicle} · {new Date(alarm.openedAt).toLocaleString()}
      </Text>

      {/* Map snapshot */}
      {MapView && alarm.latitude && alarm.longitude ? (
        <View style={styles.mapBox}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            scrollEnabled={false}
            zoomEnabled={false}
            initialRegion={{
              latitude: Number(alarm.latitude),
              longitude: Number(alarm.longitude),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: Number(alarm.latitude),
                longitude: Number(alarm.longitude),
              }}
            />
          </MapView>
        </View>
      ) : null}

      {/* Acknowledge */}
      {!alarm.acknowledged ? (
        <View style={styles.ackBox}>
          <Text style={styles.ackTitle}>Acknowledge</Text>
          <TextInput
            value={ackNote}
            onChangeText={setAckNote}
            placeholder="Optional note (max 500 chars)"
            placeholderTextColor={colors.text.muted}
            multiline
            maxLength={500}
            style={styles.ackInput}
          />
          <TouchableOpacity
            style={[styles.btnPrimary, acking && styles.btnDisabled]}
            disabled={acking}
            onPress={onAck}
          >
            <Text style={styles.btnPrimaryText}>
              {acking ? 'Acknowledging…' : 'Acknowledge alarm'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.ackedBox}>
          <Text style={styles.ackedTitle}>Acknowledged</Text>
          <Text style={styles.ackedBody}>
            {alarm.acknowledgedAt
              ? new Date(alarm.acknowledgedAt).toLocaleString()
              : ''}
            {alarm.ackNote ? ` · ${alarm.ackNote}` : ''}
          </Text>
        </View>
      )}

      {/* Secondary actions */}
      <TouchableOpacity
        style={styles.btnGhost}
        onPress={() => navigation.navigate('LiveTrack', { terminalId: alarm.terminalId })}
      >
        <Text style={styles.btnGhostText}>View vehicle live →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnGhost} onPress={onCreateAppointment}>
        <Text style={styles.btnGhostText}>Create service appointment →</Text>
      </TouchableOpacity>

      {/* Raw payload (dev-only collapsible) */}
      {__DEV__ && alarm.extraData ? (
        <View style={styles.devBox}>
          <Text style={styles.devTitle}>Technical details (DEV)</Text>
          <Text style={styles.devBody}>
            {JSON.stringify(alarm.extraData, null, 2)}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

function humanise(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  content: { padding: spacing.screenHorizontal, paddingBottom: 120 },

  severityChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  severityChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginBottom: 16 },
  mapBox: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },

  ackBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  ackInput: {
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text.primary,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  btnPrimary: {
    backgroundColor: colors.primary.navy,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  ackedBox: {
    backgroundColor: colors.status.successLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: 12,
  },
  ackedTitle: {
    fontWeight: '700',
    color: colors.status.success,
    marginBottom: 4,
  },
  ackedBody: { fontSize: 12, color: colors.text.secondary },

  btnGhost: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  btnGhostText: { color: colors.primary.navy, fontWeight: '700' },

  devBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: 16,
  },
  devTitle: {
    color: '#F1F5F9',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 12,
  },
  devBody: {
    color: '#A5B4FC',
    fontFamily: 'monospace' as any,
    fontSize: 11,
  },
});
