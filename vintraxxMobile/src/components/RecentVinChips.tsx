import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RecentVinEntry } from '../services/storage/StorageService';

interface Props {
  vins: RecentVinEntry[];
  onPick: (entry: RecentVinEntry) => void;
  onLongPress?: (entry: RecentVinEntry) => void;
  title?: string;
}

/**
 * Horizontal chip list of the user's recently-used VINs. Tapping a chip
 * should fill the VIN field in the parent screen and trigger decode. Long
 * pressing deletes the chip (optional, via `onLongPress`). Rendered as null
 * when there are no recent VINs — callers can drop it in unconditionally.
 */
export const RecentVinChips: React.FC<Props> = ({ vins, onPick, onLongPress, title = 'Recent VINs' }) => {
  if (!vins || vins.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {vins.map((entry) => {
          const label = entry.vin.slice(-8); // last 8 chars — unique enough, readable
          const vehicle = [entry.year, entry.make, entry.model].filter(Boolean).join(' ');
          return (
            <TouchableOpacity
              key={entry.vin}
              style={styles.chip}
              onPress={() => onPick(entry)}
              onLongPress={onLongPress ? () => onLongPress(entry) : undefined}
              activeOpacity={0.7}
              accessibilityLabel={`Use recent VIN ${entry.vin}`}
            >
              <Text style={styles.chipVin}>…{label}</Text>
              {vehicle ? <Text style={styles.chipVehicle} numberOfLines={1}>{vehicle}</Text> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  scroll: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: spacing.md,
  },
  chip: {
    backgroundColor: colors.primary.navy,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  chipVin: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  chipVehicle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 2,
    maxWidth: 140,
  },
});
