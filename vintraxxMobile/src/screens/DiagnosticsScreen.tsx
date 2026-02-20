// DiagnosticsScreen for VinTraxx SmartScan - DEV only
// Shows BLE connection info, services/characteristics, logs, and command testing

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { scannerService } from '../services/scanner/ScannerService';
import { useAppStore } from '../store/appStore';
import { logger, LogCategory } from '../utils/Logger';
import { BleServiceInfo } from '../services/ble/types';

interface DiagnosticsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const DiagnosticsScreen: React.FC<DiagnosticsScreenProps> = ({ visible, onClose }) => {
  const [command, setCommand] = useState('ATI');
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<BleServiceInfo[]>([]);
  const [logs, setLogs] = useState<string>('');

  const { selectedBleDevice, connectionState } = useAppStore();

  // Load discovered services
  const handleLoadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const discoveredServices = await scannerService.getDiscoveredServices();
      setServices(discoveredServices);
      logger.info(LogCategory.APP, 'Loaded services for diagnostics', { count: discoveredServices.length });
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to load services', error);
    }
    setIsLoading(false);
  }, []);

  // Send test command
  const handleSendCommand = useCallback(async () => {
    if (!command.trim()) return;
    
    setIsLoading(true);
    setCommandResult(null);
    
    try {
      logger.info(LogCategory.APP, `[DIAG] Sending command: ${command}`);
      
      // Use the BLE manager directly for raw command
      const { bleManager } = require('../services/ble/BleManager');
      const result = await bleManager.sendCommand(command.trim());
      
      setCommandResult(result);
      logger.info(LogCategory.APP, `[DIAG] Command result`, { result });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setCommandResult(`ERROR: ${errorMsg}`);
      logger.error(LogCategory.APP, '[DIAG] Command failed', error);
    }
    
    setIsLoading(false);
  }, [command]);

  // Export logs
  const handleExportLogs = useCallback(() => {
    const exportedLogs = logger.exportLogs();
    setLogs(exportedLogs);
  }, []);

  // Quick command buttons
  const quickCommands = ['ATI', 'ATZ', '0100', '0902', '03', '07', '0101', '0131'];

  if (!visible) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔧 Diagnostics</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Connection Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>State:</Text>
            <Text style={styles.infoValue}>{connectionState}</Text>
          </View>
          {selectedBleDevice && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Device:</Text>
                <Text style={styles.infoValue}>{selectedBleDevice.name || 'Unknown'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID:</Text>
                <Text style={[styles.infoValue, styles.monoText]}>{selectedBleDevice.id}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>RSSI:</Text>
                <Text style={styles.infoValue}>{selectedBleDevice.rssi} dBm</Text>
              </View>
            </>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Protocol:</Text>
            <Text style={styles.infoValue}>{scannerService.getProtocolInfo() || 'Not detected'}</Text>
          </View>
        </View>

        {/* Services & Characteristics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services & Characteristics</Text>
            <Button
              title="Load"
              onPress={handleLoadServices}
              variant="outline"
              size="small"
              loading={isLoading}
            />
          </View>
          {services.length > 0 ? (
            services.map((service, sIdx) => (
              <View key={sIdx} style={styles.serviceItem}>
                <Text style={styles.serviceUuid}>
                  {service.isPrimary ? '🔵' : '⚪'} {service.uuid}
                </Text>
                {service.characteristics.map((char, cIdx) => {
                  const props: string[] = [];
                  if (char.isReadable) props.push('R');
                  if (char.isWritableWithResponse) props.push('W');
                  if (char.isWritableWithoutResponse) props.push('WNR');
                  if (char.isNotifiable) props.push('N');
                  if (char.isIndicatable) props.push('I');
                  
                  return (
                    <Text key={cIdx} style={styles.charUuid}>
                      └─ {char.uuid} [{props.join(',')}]
                    </Text>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Tap "Load" to discover services</Text>
          )}
        </View>

        {/* Command Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Command Testing</Text>
          <View style={styles.quickCommands}>
            {quickCommands.map((cmd) => (
              <TouchableOpacity
                key={cmd}
                style={styles.quickCommandButton}
                onPress={() => setCommand(cmd)}
              >
                <Text style={styles.quickCommandText}>{cmd}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.commandInputRow}>
            <TextInput
              style={styles.commandInput}
              value={command}
              onChangeText={setCommand}
              placeholder="Enter command (e.g., ATI, 0902)"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="characters"
            />
            <Button
              title="Send"
              onPress={handleSendCommand}
              variant="primary"
              size="small"
              loading={isLoading}
              disabled={!command.trim()}
            />
          </View>
          {commandResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultLabel}>Response:</Text>
              <ScrollView style={styles.resultScroll} horizontal>
                <Text style={styles.resultText}>
                  {commandResult.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}
                </Text>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Logs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Logs</Text>
            <Button
              title="Export"
              onPress={handleExportLogs}
              variant="outline"
              size="small"
            />
          </View>
          {logs ? (
            <ScrollView style={styles.logsContainer} nestedScrollEnabled>
              <Text style={styles.logsText}>{logs}</Text>
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>Tap "Export" to view logs</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.dark,
  },
  headerTitle: {
    ...typography.styles.h3,
    color: colors.text.inverse,
  },
  closeButton: {
    padding: spacing.sm,
  },
  closeButtonText: {
    ...typography.styles.h4,
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenHorizontal,
  },
  section: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.styles.label,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  infoLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.styles.bodySmall,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  monoText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  serviceItem: {
    marginBottom: spacing.sm,
  },
  serviceUuid: {
    ...typography.styles.caption,
    color: colors.primary.navy,
    fontFamily: 'monospace',
    fontWeight: typography.fontWeight.semiBold,
  },
  charUuid: {
    ...typography.styles.caption,
    color: colors.text.muted,
    fontFamily: 'monospace',
    marginLeft: spacing.md,
  },
  emptyText: {
    ...typography.styles.bodySmall,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  quickCommands: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  quickCommandButton: {
    backgroundColor: colors.background.tab,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.inputRadius,
  },
  quickCommandText: {
    ...typography.styles.caption,
    color: colors.primary.navy,
    fontFamily: 'monospace',
    fontWeight: typography.fontWeight.medium,
  },
  commandInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  commandInput: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: spacing.inputRadius,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.styles.body,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  resultBox: {
    marginTop: spacing.md,
    backgroundColor: colors.background.dark,
    borderRadius: spacing.inputRadius,
    padding: spacing.md,
  },
  resultLabel: {
    ...typography.styles.caption,
    color: colors.text.light,
    marginBottom: spacing.xs,
  },
  resultScroll: {
    maxHeight: 100,
  },
  resultText: {
    ...typography.styles.bodySmall,
    color: colors.status.success,
    fontFamily: 'monospace',
  },
  logsContainer: {
    maxHeight: 200,
    backgroundColor: colors.background.dark,
    borderRadius: spacing.inputRadius,
    padding: spacing.sm,
  },
  logsText: {
    ...typography.styles.caption,
    color: colors.text.light,
    fontFamily: 'monospace',
    fontSize: 10,
  },
});
