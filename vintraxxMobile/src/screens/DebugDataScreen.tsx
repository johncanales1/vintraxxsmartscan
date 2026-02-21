// Debug Data Screen - Shows detailed TX/RX logs from scan session
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { debugLogger, DebugLogEntry, LogDirection } from '../services/debug/DebugLogger';

interface DebugDataScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const DebugDataScreen: React.FC<DebugDataScreenProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<DebugLogEntry[]>([]);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Refresh logs when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Get fresh logs from debugLogger when modal opens
      setLogs(debugLogger.getLogs());
      setSessionDuration(debugLogger.getSessionDuration());
    }
  }, [visible]);

  // Function to manually refresh logs
  const refreshLogs = useCallback(() => {
    setLogs(debugLogger.getLogs());
    setSessionDuration(debugLogger.getSessionDuration());
  }, []);

  const handleExport = async () => {
    try {
      const exportText = debugLogger.exportLogsAsText();
      await Share.share({
        title: 'VinTraxx Debug Log',
        message: exportText,
      });
    } catch (error) {
      console.error('Error sharing debug log:', error);
    }
  };

  const getDirectionColor = (direction: LogDirection): string => {
    switch (direction) {
      case LogDirection.TX:
        return colors.status.info;
      case LogDirection.RX:
        return colors.status.success;
      case LogDirection.ERROR:
        return colors.status.error;
      case LogDirection.EVENT:
        return colors.text.secondary;
      default:
        return colors.text.primary;
    }
  };

  const getDirectionIcon = (direction: LogDirection): string => {
    switch (direction) {
      case LogDirection.TX:
        return '→';
      case LogDirection.RX:
        return '←';
      case LogDirection.ERROR:
        return '✗';
      case LogDirection.EVENT:
        return '●';
      default:
        return '•';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const sessionStart = logs.length > 0 ? logs[0].timestamp : timestamp;
    const relative = timestamp - sessionStart;
    return `+${relative}ms`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Debug Data</Text>
            <Text style={styles.headerSubtitle}>
              {logs.length} entries • {Math.round(sessionDuration / 1000)}s
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={refreshLogs} style={styles.refreshButton}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExport} style={styles.exportButton}>
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Log Entries */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No debug data available</Text>
              <Text style={styles.emptyStateSubtext}>
                Debug data is collected during scan sessions
              </Text>
            </View>
          ) : (
            logs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                {/* Header Line */}
                <View style={styles.logHeader}>
                  <View style={styles.logHeaderLeft}>
                    <Text
                      style={[
                        styles.logDirection,
                        { color: getDirectionColor(log.direction) },
                      ]}
                    >
                      {getDirectionIcon(log.direction)} {log.direction}
                    </Text>
                    <Text style={styles.logTimestamp}>
                      {formatTimestamp(log.timestamp)}
                    </Text>
                  </View>
                </View>

                {/* Message */}
                <Text style={styles.logMessage}>{log.message}</Text>

                {/* Raw Hex */}
                {log.rawHex && (
                  <View style={styles.logDetail}>
                    <Text style={styles.logDetailLabel}>Raw Hex:</Text>
                    <Text style={styles.logDetailValue}>{log.rawHex}</Text>
                  </View>
                )}

                {/* Parsed Text */}
                {log.parsedText && log.parsedText !== log.message && (
                  <View style={styles.logDetail}>
                    <Text style={styles.logDetailLabel}>Parsed:</Text>
                    <Text style={styles.logDetailValue}>
                      {log.parsedText.replace(/\r/g, '\\r').replace(/\n/g, '\\n')}
                    </Text>
                  </View>
                )}

                {/* Error */}
                {log.error && (
                  <View style={styles.logDetail}>
                    <Text style={[styles.logDetailLabel, styles.errorLabel]}>Error:</Text>
                    <Text style={[styles.logDetailValue, styles.errorValue]}>
                      {log.error}
                    </Text>
                  </View>
                )}

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <View style={styles.logDetail}>
                    <Text style={styles.logDetailLabel}>Metadata:</Text>
                    <Text style={styles.logDetailValue}>
                      {JSON.stringify(log.metadata, null, 2)}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  headerTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.navy,
    borderRadius: 6,
  },
  backButtonText: {
    ...typography.styles.button,
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '700',
  },
  refreshButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.status.info + '20',
    borderRadius: 6,
  },
  refreshButtonText: {
    ...typography.styles.button,
    color: colors.status.info,
    fontSize: 14,
  },
  exportButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.navy + '80',
    borderRadius: 6,
  },
  exportButtonText: {
    ...typography.styles.button,
    color: colors.text.inverse,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyStateText: {
    ...typography.styles.h3,
    color: colors.text.secondary,
  },
  emptyStateSubtext: {
    ...typography.styles.body,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  logEntry: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.border.medium,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logDirection: {
    ...typography.styles.label,
    fontWeight: '700',
  },
  logTimestamp: {
    ...typography.styles.caption,
    color: colors.text.muted,
    fontFamily: 'Courier',
  },
  logMessage: {
    ...typography.styles.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  logDetail: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  logDetailLabel: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  logDetailValue: {
    ...typography.styles.caption,
    fontFamily: 'Courier',
    color: colors.text.primary,
    fontSize: 11,
  },
  errorLabel: {
    color: colors.status.error,
  },
  errorValue: {
    color: colors.status.error,
  },
});
