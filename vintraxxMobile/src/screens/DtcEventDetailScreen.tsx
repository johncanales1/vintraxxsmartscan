// DtcEventDetailScreen — single GPS-side DTC snapshot with AI bridge.
//
// The "AI bridge" reuses the existing OBD report pipeline:
//
//   1. POST `/gps/dtc-events/:id/analyze` → backend creates (or reuses)
//      a `Scan` row mirroring this DTC snapshot and returns `{ scanId,
//      reused }`.
//   2. Mobile then calls the existing `apiService.pollReport(scanId)`,
//      which is the same endpoint the BLE scan flow uses; it long-polls
//      until the report is ready.
//   3. Once ready, we navigate to `FullReport` with the same shape the
//      BLE flow uses — so the user lands on a familiar screen.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { gpsApi } from '../services/gps/GpsApiService';
import { apiService } from '../services/api/ApiService';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RootStackParamList } from '../navigation/types';
import type { GpsDtcEvent } from '../types/gps';

import WarningIcon from '../assets/icons/warning.svg';

type DtcEventDetailRoute = RouteProp<RootStackParamList, 'DtcEventDetail'>;

export const DtcEventDetailScreen: React.FC = () => {
  const route = useRoute<DtcEventDetailRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { dtcEventId } = route.params;

  const [event, setEvent] = useState<GpsDtcEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await gpsApi.getDtcEvent(dtcEventId);
      if (cancelled) return;
      if (!result.success || !result.data) {
        logger.warn(LogCategory.APP, '[DtcEventDetail] getDtcEvent failed', {
          message: result.message,
        });
        setLoading(false);
        return;
      }
      setEvent(result.data.event);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [dtcEventId]);

  const onAnalyze = async () => {
    if (!event) return;
    setAnalyzing(true);
    setPollStatus('Creating analysis…');
    try {
      const bridge = await gpsApi.analyzeDtcEvent(dtcEventId);
      if (!bridge.success || !bridge.data) {
        Alert.alert(
          'Could not analyze',
          bridge.message ?? 'The server could not start an AI analysis.',
        );
        return;
      }
      const { scanId, reused } = bridge.data;
      logger.info(LogCategory.APP, '[DtcEventDetail] analyze bridge', {
        scanId,
        reused,
      });

      // Poll the existing scan/report endpoint. Reuses the same long-poll
      // logic the BLE scan flow uses, so the perceived behaviour is
      // identical.
      const report = await apiService.pollReport(scanId, (s) => setPollStatus(s));
      if (!report.success || !report.data) {
        Alert.alert(
          'Analysis failed',
          report.message ?? 'The report could not be generated.',
        );
        return;
      }

      // Same target as the BLE scan flow — full report screen — but we hand
      // it the already-resolved report so the screen short-circuits its
      // submit/poll pipeline. We also pass the scanId so the screen's retry
      // button can re-poll if the user taps it.
      navigation.navigate('FullReport', {
        prefetchedReport: report.data,
        prefetchedScanId: scanId,
      });
    } finally {
      setAnalyzing(false);
      setPollStatus(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
      </View>
    );
  }
  if (!event) {
    return (
      <View style={styles.loadingWrap}>
        <Text>Could not load this DTC event.</Text>
      </View>
    );
  }

  const vehicle =
    event.terminal?.nickname ??
    [event.terminal?.vehicleYear, event.terminal?.vehicleMake, event.terminal?.vehicleModel]
      .filter(Boolean)
      .join(' ') ??
    'Unknown vehicle';

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{vehicle}</Text>
      <Text style={styles.subtitle}>
        {new Date(event.reportedAt).toLocaleString()}
        {event.protocol ? ` · ${event.protocol}` : ''}
        {event.mileageKm != null
          ? ` · ${Math.round(event.mileageKm * 0.621371)} mi`
          : ''}
      </Text>

      {event.milOn && (
        <View style={styles.milBanner}>
          <WarningIcon width={16} height={16} color={colors.status.error} />
          <Text style={styles.milBannerText}>MIL is currently ON</Text>
        </View>
      )}

      <CodeSection
        title={`Stored codes (${event.storedDtcCodes.length})`}
        codes={event.storedDtcCodes}
      />
      <CodeSection
        title={`Pending codes (${event.pendingDtcCodes.length})`}
        codes={event.pendingDtcCodes}
      />
      <CodeSection
        title={`Permanent codes (${event.permanentDtcCodes.length})`}
        codes={event.permanentDtcCodes}
        critical
      />

      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>AI Analysis</Text>
        <Text style={styles.actionsBody}>
          Run the same diagnostic AI used after a Bluetooth scan against this
          GPS-captured snapshot. You'll land on the standard Full Report view.
        </Text>
        <TouchableOpacity
          style={[styles.btnPrimary, analyzing && styles.btnDisabled]}
          onPress={onAnalyze}
          disabled={analyzing || event.dtcCount === 0}
        >
          <Text style={styles.btnPrimaryText}>
            {analyzing
              ? pollStatus ?? 'Analyzing…'
              : event.dtcCount === 0
              ? 'No codes to analyze'
              : 'Run AI analysis'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const CodeSection: React.FC<{
  title: string;
  codes: string[];
  critical?: boolean;
}> = ({ title, codes, critical }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, critical && styles.sectionTitleCritical]}>
      {title}
    </Text>
    {codes.length === 0 ? (
      <Text style={styles.sectionEmpty}>None</Text>
    ) : (
      <View style={styles.codeChipRow}>
        {codes.map((c) => (
          <View
            key={c}
            style={[styles.codeChip, critical && styles.codeChipCritical]}
          >
            <Text
              style={[
                styles.codeChipText,
                critical && styles.codeChipTextCritical,
              ]}
            >
              {c}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background.primary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.screenHorizontal, paddingBottom: 120 },

  title: { fontSize: 22, fontWeight: '700', color: colors.text.primary },
  subtitle: { fontSize: 13, color: colors.text.secondary, marginTop: 2, marginBottom: 12 },

  milBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.errorLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  milBannerText: {
    color: colors.status.error,
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },

  section: {
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 8,
  },
  sectionTitleCritical: { color: colors.status.error },
  sectionEmpty: { fontSize: 12, color: colors.text.muted },
  codeChipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  codeChip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },
  codeChipCritical: { backgroundColor: colors.status.errorLight },
  codeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: 'monospace' as any,
  },
  codeChipTextCritical: { color: colors.status.error },

  actionsCard: {
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  actionsBody: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  btnPrimary: {
    backgroundColor: colors.primary.navy,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
});
