// WorkflowSwitchButton — header button to switch between BLE and GPS modes.
//
// Rendered in the top navigation bar. Tapping it sets `workflowMode` to null,
// which reactively navigates back to the WorkflowSelector screen.

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAppStore } from '../store/appStore';
import { logger, LogCategory } from '../utils/Logger';
import { colors } from '../theme/colors';

export const WorkflowSwitchButton: React.FC = () => {
  const { workflowMode, setWorkflowMode } = useAppStore();

  const handleSwitch = useCallback(() => {
    Alert.alert(
      'Switch Mode',
      `You are currently in ${workflowMode === 'gps' ? 'GPS' : 'BLE'} mode. Switch to the other mode?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => {
            logger.info(LogCategory.APP, `Switching from ${workflowMode} mode`);
            setWorkflowMode(null);
          },
        },
      ],
    );
  }, [workflowMode, setWorkflowMode]);

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleSwitch}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.icon}>⇄</Text>
      <Text style={styles.label}>
        {workflowMode === 'gps' ? 'GPS' : 'BLE'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 4,
  },
  icon: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
