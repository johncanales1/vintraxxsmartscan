// WorkflowSwitchButton — floating "switch scan mode" pill.
//
// Rendered as a top-right safe-area overlay inside the BLE and GPS tab
// navigators, so it appears on every main tab screen (but not on deep detail
// screens). Tapping it sets `workflowMode` to null, which reactively navigates
// back to the WorkflowSelector screen where the user picks BLE or GPS again.

import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/appStore';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';

export const WorkflowSwitchButton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const workflowMode = useAppStore((s) => s.workflowMode);
  const setWorkflowMode = useAppStore((s) => s.setWorkflowMode);

  const handleSwitch = useCallback(() => {
    Alert.alert(
      'Switch scanning mode',
      "You'll return to the mode selector to choose BLE or GPS.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            logger.info(LogCategory.APP, `Switching scan mode from ${workflowMode}`);
            setWorkflowMode(null);
          },
        },
      ],
    );
  }, [workflowMode, setWorkflowMode]);

  return (
    <View
      style={[styles.wrap, { top: insets.top + 6 }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handleSwitch}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Switch scanning mode"
      >
        <Text style={styles.icon}>⇄</Text>
        <Text style={styles.label}>Switch</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 12,
    zIndex: 1000,
    elevation: 1000,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  icon: {
    fontSize: 15,
    color: colors.primary.navy,
    marginRight: 5,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary.navy,
    letterSpacing: 0.3,
  },
});
