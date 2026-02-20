// ConnectScreen for VinTraxx SmartScan
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { DualSpinner } from '../components/DualSpinner';
import { useAppStore } from '../store/appStore';
import { scannerService } from '../services/scanner/ScannerService';
import { authService } from '../services/auth/AuthService';
import { BleConnectionState, BleDevice } from '../services/ble/types';
import { logger, LogCategory } from '../utils/Logger';
import { DiagnosticsScreen } from './DiagnosticsScreen';

// Import SVG icons
import OBD2Icon from '../assets/icons/obd2.svg';
import PlugIcon from '../assets/icons/plug.svg';
import TipIcon from '../assets/icons/tip.svg';
import ConnectIcon from '../assets/icons/connect.svg';
import CloseIcon from '../assets/icons/close.svg';

interface ConnectScreenProps {
  navigation: any;
  route?: {
    params?: {
      autoConnect?: boolean;
      autoScan?: boolean;
    };
  };
}

// Helper to convert BleConnectionState to ConnectionStatus for badge
const getConnectionStatus = (state: BleConnectionState): 'disconnected' | 'connecting' | 'connected' => {
  switch (state) {
    case BleConnectionState.CONNECTED:
      return 'connected';
    case BleConnectionState.CONNECTING:
    case BleConnectionState.DISCOVERING:
      return 'connecting';
    default:
      return 'disconnected';
  }
};

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ navigation, route }) => {
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // DEV mode activation state
  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<NodeJS.Timeout | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Zustand store
  const {
    connectionState,
    discoveredDevices,
    selectedBleDevice,
    userDevice,
    setConnectionState,
    setDiscoveredDevices,
    setSelectedBleDevice,
    devModeActivated,
    setDevModeActivated,
    setUser,
    setIsAuthenticated,
    setDeviceSetupCompleted,
    setUserDevice,
  } = useAppStore();

  const connectionStatus = getConnectionStatus(connectionState);
  const autoConnectAttempted = useRef(false);
  const autoScanAttempted = useRef(false);

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = scannerService.onConnectionStateChange((state) => {
      logger.info(LogCategory.APP, `Connection state changed: ${state}`);
      setConnectionState(state);
      
      // Reset auto-scan flag on disconnect so it triggers again on next connection
      if (state === BleConnectionState.DISCONNECTED) {
        autoScanAttempted.current = false;
      }

      // Auto-navigate to Scan screen on any successful connection
      if (state === BleConnectionState.CONNECTED && !autoScanAttempted.current) {
        autoScanAttempted.current = true;
        logger.info(LogCategory.APP, 'Device connected — auto-navigating to Scan screen');
        setTimeout(() => {
          navigation.navigate('Scan', { autoStart: route?.params?.autoScan ? true : false });
        }, 500);
      }
    });
    return () => unsubscribe();
  }, [setConnectionState, navigation, route?.params?.autoScan]);

  // Handle auto-connect on mount
  useEffect(() => {
    if (route?.params?.autoConnect && selectedBleDevice && !autoConnectAttempted.current && connectionState === BleConnectionState.DISCONNECTED) {
      autoConnectAttempted.current = true;
      logger.info(LogCategory.APP, 'Auto-connecting to previously selected device');
      handleDeviceSelect(selectedBleDevice);
    } else if (route?.params?.autoConnect && userDevice?.macAddress && !autoConnectAttempted.current) {
      autoConnectAttempted.current = true;
      logger.info(LogCategory.APP, 'Auto-scanning for user device');
      handleStartScan();
    }
  }, [route?.params?.autoConnect, selectedBleDevice, userDevice, connectionState]);

  // Auto-connect to user's saved device if found during scan
  useEffect(() => {
    if (route?.params?.autoConnect && userDevice?.macAddress && discoveredDevices.length > 0 && !autoConnectAttempted.current) {
      const savedDevice = discoveredDevices.find(d => d.id === userDevice.macAddress);
      if (savedDevice) {
        autoConnectAttempted.current = true;
        logger.info(LogCategory.APP, 'Found user device, auto-connecting');
        handleDeviceSelect(savedDevice);
      }
    }
  }, [route?.params?.autoConnect, userDevice, discoveredDevices]);

  // Handle BLE scan for devices
  const handleStartScan = useCallback(async () => {
    logger.info(LogCategory.APP, 'Starting BLE device scan');
    setScanError(null);
    setIsScanning(true);
    setDiscoveredDevices([]);
    // Don't show modal, keep it inline

    try {
      await scannerService.startDeviceScan(
        (devices: BleDevice[]) => {
          logger.debug(LogCategory.APP, `Discovered ${devices.length} devices`);
          setDiscoveredDevices(devices);
        },
        undefined // No filter - show all devices, but we'll sort by relevance
      );

      // Auto-stop scan after 15 seconds
      setTimeout(() => {
        if (isScanning) {
          scannerService.stopDeviceScan();
          setIsScanning(false);
          logger.info(LogCategory.APP, 'BLE scan auto-stopped after timeout');
        }
      }, 15000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(LogCategory.APP, 'BLE scan failed', error);
      setScanError(errorMessage);
      setIsScanning(false);
      Alert.alert('Scan Error', errorMessage);
    }
  }, [setDiscoveredDevices, isScanning]);

  // Handle device selection and connection
  const handleDeviceSelect = useCallback(async (device: BleDevice) => {
    logger.info(LogCategory.APP, `Connecting to device: ${device.name} (${device.id})`);
    scannerService.stopDeviceScan();
    setIsScanning(false);
    setSelectedBleDevice(device);

    try {
      await scannerService.connectToDevice(device.id);
      logger.info(LogCategory.APP, 'Device connected successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      logger.error(LogCategory.APP, 'Device connection failed', error);
      Alert.alert('Connection Failed', errorMessage);
      setSelectedBleDevice(null);
    }
  }, [setSelectedBleDevice]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    logger.info(LogCategory.APP, 'Disconnecting from device');
    try {
      await scannerService.disconnect();
      setSelectedBleDevice(null);
    } catch (error) {
      logger.error(LogCategory.APP, 'Disconnect failed', error);
    }
  }, [setSelectedBleDevice]);

  // Main connect button handler
  const handleConnect = () => {
    if (connectionStatus === 'disconnected') {
      handleStartScan();
    } else if (connectionStatus === 'connected') {
      handleDisconnect();
    }
  };

  // Stop scanning
  const handleStopScan = () => {
    scannerService.stopDeviceScan();
    setIsScanning(false);
  };

  // Hidden DEV mode activation - tap logo 7 times within 3 seconds
  const handleLogoTap = useCallback(() => {
    logoTapCount.current += 1;
    
    // Clear existing timer
    if (logoTapTimer.current) {
      clearTimeout(logoTapTimer.current);
    }
    
    // Check if we've reached 7 taps
    if (logoTapCount.current >= 7) {
      logoTapCount.current = 0;
      if (!devModeActivated) {
        setDevModeActivated(true);
        logger.info(LogCategory.APP, 'DEV mode activated');
        Alert.alert('DEV Mode', 'Developer mode activated.');
      } else {
        setDevModeActivated(false);
        logger.info(LogCategory.APP, 'DEV mode deactivated');
        Alert.alert('DEV Mode', 'Developer mode deactivated.');
      }
      return;
    }
    
    // Reset after 3 seconds of no taps
    logoTapTimer.current = setTimeout(() => {
      logoTapCount.current = 0;
    }, 3000);
  }, [devModeActivated, setDevModeActivated]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            logger.info(LogCategory.APP, 'User initiated logout');
            
            // Disconnect BLE if connected
            if (connectionState !== BleConnectionState.DISCONNECTED) {
              try {
                await scannerService.disconnect();
              } catch (error) {
                logger.warn(LogCategory.APP, 'Failed to disconnect during logout', error);
              }
            }
            
            // Clear auth state
            await authService.logout();
            
            // Reset Zustand store state
            setUser(null);
            setIsAuthenticated(false);
            setDeviceSetupCompleted(false);
            setUserDevice(null);
            setSelectedBleDevice(null);
            setDiscoveredDevices([]);
            
            logger.info(LogCategory.APP, 'Logout complete, returning to login screen');
          },
        },
      ]
    );
  }, [connectionState, setUser, setIsAuthenticated, setDeviceSetupCompleted, setUserDevice, setSelectedBleDevice, setDiscoveredDevices]);

  // Sort devices: prioritize OBD-related names
  const sortedDevices = [...discoveredDevices].sort((a, b) => {
    const obdKeywords = ['VEEPEAK', 'OBD', 'ELM', 'BLE', 'SCAN', 'VLINK', 'KONNWEI'];
    const aIsObd = obdKeywords.some(kw => a.name?.toUpperCase().includes(kw));
    const bIsObd = obdKeywords.some(kw => b.name?.toUpperCase().includes(kw));
    if (aIsObd && !bIsObd) return -1;
    if (!aIsObd && bIsObd) return 1;
    // Secondary sort by signal strength
    return (b.rssi || -100) - (a.rssi || -100);
  });

  // Render device item in list
  const renderDeviceItem = ({ item }: { item: BleDevice }) => {
    const obdKeywords = ['VEEPEAK', 'OBD', 'ELM', 'BLE', 'SCAN', 'VLINK', 'KONNWEI'];
    const isLikelyObd = obdKeywords.some(kw => item.name?.toUpperCase().includes(kw));
    
    return (
      <TouchableOpacity
        style={[styles.deviceItem, isLikelyObd && styles.deviceItemHighlighted]}
        onPress={() => handleDeviceSelect(item)}
      >
        <View style={styles.deviceInfo}>
          <Text style={[styles.deviceName, isLikelyObd && styles.deviceNameHighlighted]}>
            {item.name || 'Unknown Device'}
          </Text>
          <Text style={styles.deviceId}>{item.id}</Text>
        </View>
        <View style={styles.deviceMeta}>
          <Text style={styles.deviceRssi}>{item.rssi} dBm</Text>
          {isLikelyObd && (
            <View style={styles.obdBadge}>
              <Text style={styles.obdBadgeText}>OBD</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed Header with Logo - tap 7 times to activate DEV mode */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleLogoTap}>
            <Image
              source={require('../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Pressable>
          {devModeActivated && (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Connection Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Scanner Status</Text>
          </View>
          
          <View style={styles.scannerInfo}>
            <Image
              source={connectionStatus === 'connected' && selectedBleDevice
                ? require('../assets/images/obd-on.png')
                : require('../assets/images/obd-off.png')
              }
              style={styles.scannerImage}
              resizeMode="contain"
            />
          </View>

          {/* Connect Button */}
          <Button
            title={
              connectionStatus === 'disconnected'
                ? 'Connect to Scanner'
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Disconnect'
            }
            onPress={handleConnect}
            variant={connectionStatus === 'connected' ? 'ghost' : 'secondary'}
            size="large"
            // icon={
            //   connectionStatus === 'disconnected' 
            //     ? <ConnectIcon width={20} height={20} color={colors.text.inverse} /> 
            //     : connectionStatus === 'connected' 
            //     ? <CloseIcon width={20} height={20} color={colors.primary.navy} /> 
            //     : undefined
            // }
            loading={connectionStatus === 'connecting'}
            fullWidth
            style={styles.connectButton}
          />
        </View>


        {/* Scanning Section */}
        {isScanning && (
          <View style={styles.scanningSection}>
            <View style={styles.scanningHeader}>
              <DualSpinner size={80} color={colors.background.dark} />
              <Text style={styles.scanningText}>Scanning for devices...</Text>
              <Button
                title="Stop Scanning"
                onPress={handleStopScan}
                variant="ghost"
                size="medium"
                style={styles.stopScanButton}
              />
            </View>

            {/* Error Display */}
            {scanError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{scanError}</Text>
              </View>
            )}

            {/* Device List */}
            {sortedDevices.length > 0 && (
              <View style={styles.deviceSection}>
                <Text style={styles.deviceSectionTitle}>Available Devices</Text>
                {sortedDevices.map((device) => {
                  const obdKeywords = ['VEEPEAK', 'OBD', 'ELM', 'BLE', 'SCAN', 'VLINK', 'KONNWEI'];
                  const isLikelyObd = obdKeywords.some(kw => device.name?.toUpperCase().includes(kw));
                  
                  return (
                    <TouchableOpacity
                      key={device.id}
                      style={[styles.deviceItem, isLikelyObd && styles.deviceItemHighlighted]}
                      onPress={() => handleDeviceSelect(device)}
                    >
                      <View style={styles.deviceInfo}>
                        <Text style={[styles.deviceName, isLikelyObd && styles.deviceNameHighlighted]}>
                          {isLikelyObd ? 'VinTraxx' : (device.name || 'Unknown Device')}
                        </Text>
                        <Text style={styles.deviceId}>{device.id}</Text>
                      </View>
                      <View style={styles.deviceMeta}>
                        <Text style={styles.deviceRssi}>{device.rssi} dBm</Text>
                        {isLikelyObd && (
                          <View style={styles.obdBadge}>
                            <Text style={styles.obdBadgeText}>OBD</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Connected Device Section */}
        {connectionStatus === 'connected' && selectedBleDevice && (
          <View style={styles.connectedDeviceSection}>
            <Text style={styles.connectedDeviceTitle}>Connected Device</Text>
            <View style={styles.connectedDeviceCard}>
              <View style={styles.connectedDeviceInfo}>
                <OBD2Icon width={24} height={24} color={colors.status.success} />
                <View style={styles.connectedDeviceText}>
                  <Text style={styles.connectedDeviceName}>
                    VinTraxx
                  </Text>
                  <Text style={styles.connectedDeviceId}>{selectedBleDevice.id}</Text>
                </View>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>Connected</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Tips - Hidden during scanning */}
        {!isScanning && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <TipIcon width={25} height={25} color={colors.status.info} />
              <Text style={styles.tipsTitle}>Quick Tips</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>1. Turn on your vehicle's ignition</Text>
              <Text style={styles.tipItem}>2. Locate the OBD-II port (usually under the dashboard)</Text>
              <Text style={styles.tipItem}>3. Make sure Bluetooth is enabled on your device</Text>
            </View>
          </View>
        )}

        {/* DEV Mode Toggle - only visible when DEV mode is activated */}
        {devModeActivated && (
          <View style={styles.devCard}>
            <View style={styles.devCardHeader}>
              <Text style={styles.devCardTitle}>🔧 Developer Options</Text>
            </View>
            <Button
              title="Open Diagnostics"
              onPress={() => setShowDiagnostics(true)}
              variant="outline"
              size="small"
              style={styles.devDiagnosticsButton}
            />
          </View>
        )}
      </ScrollView>


      {/* Diagnostics Screen Modal - DEV only */}
      {devModeActivated && (
        <Modal
          visible={showDiagnostics}
          animationType="slide"
          onRequestClose={() => setShowDiagnostics(false)}
        >
          <DiagnosticsScreen
            visible={showDiagnostics}
            onClose={() => setShowDiagnostics(false)}
          />
        </Modal>
      )}
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
    backgroundColor: colors.background.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 60,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.background.tab,
  },
  logoutButtonText: {
    ...typography.styles.bodySmall,
    color: colors.primary.red,
    fontWeight: typography.fontWeight.semiBold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['3xl'],
  },
  statusCard: {
    // backgroundColor: colors.background.secondary,
    // borderRadius: spacing.cardRadius,
    // padding: spacing.lg,
    marginBottom: spacing.lg,
    // shadowColor: colors.shadow,
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    // justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statusTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  scannerInfo: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
  scannerImage: {
    width: 140,
    height: 140,
  },
  scannerIconConnected: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: colors.status.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scannerIconDisconnected: {
    width: 60,
    height: 60,
    borderRadius: 40,
    backgroundColor: colors.background.tab,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scannerName: {
    ...typography.styles.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  scannerSerial: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  scannerInstructions: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 250,
  },
  connectButton: {
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  sectionAction: {
    ...typography.styles.label,
    color: colors.primary.red,
  },
  tipsCard: {
    backgroundColor: colors.status.infoLight,
    // borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.info,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipsTitle: {
    ...typography.styles.label,
    color: colors.status.info,
  },
  tipsList: {
    gap: spacing.xs,
  },
  tipItem: {
    ...typography.styles.bodySmall,
    color: colors.text.secondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: spacing.cardRadius * 2,
    borderTopRightRadius: spacing.cardRadius * 2,
    maxHeight: '70%',
    minHeight: 300,
    // paddingBottom: spacing.xl + 60, // Account for tab bar height + margin
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.status.errorLight,
    marginHorizontal: spacing.lg,
    borderRadius: spacing.inputRadius,
  },
  errorText: {
    ...typography.styles.bodySmall,
    color: colors.status.error,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    ...typography.styles.h4,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  emptyStateHint: {
    ...typography.styles.body,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  rescanButton: {
    marginTop: spacing.md,
  },
  deviceList: {
    flex: 1,
  },
  deviceListContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  deviceSeparator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.inputRadius,
  },
  deviceItemHighlighted: {
    backgroundColor: colors.status.successLight,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.styles.label,
    color: colors.text.primary,
    marginBottom: 2,
  },
  deviceNameHighlighted: {
    color: colors.status.success,
    fontWeight: typography.fontWeight.semiBold,
  },
  deviceId: {
    ...typography.styles.caption,
    color: colors.text.muted,
    fontFamily: 'monospace',
  },
  deviceMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  deviceRssi: {
    ...typography.styles.caption,
    color: colors.text.muted,
  },
  obdBadge: {
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  obdBadgeText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semiBold,
    fontSize: 10,
  },
  scanningSection: {
    marginBottom: spacing.lg,
  },
  scanningHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  scanningText: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  stopScanButton: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  deviceSection: {
    marginTop: spacing.lg,
  },
  deviceSectionTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  connectedDeviceSection: {
    marginBottom: spacing.lg,
  },
  connectedDeviceTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  connectedDeviceCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  connectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  connectedDeviceText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  connectedDeviceName: {
    ...typography.styles.label,
    color: colors.text.primary,
  },
  connectedDeviceId: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: colors.status.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadgeText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semiBold,
  },
  // DEV mode styles
  devBadge: {
    backgroundColor: colors.status.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  devBadgeText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    fontSize: 10,
  },
  devCard: {
    backgroundColor: colors.status.warningLight,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    borderLeftWidth: 4,
    borderLeftColor: colors.status.warning,
    marginTop: spacing.lg,
  },
  devCardHeader: {
    marginBottom: spacing.md,
  },
  devCardTitle: {
    ...typography.styles.label,
    color: colors.status.warning,
    fontWeight: typography.fontWeight.semiBold,
  },
  devToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devToggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  devToggleLabel: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  devToggleHint: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  devToggleSwitch: {
    backgroundColor: colors.border.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.inputRadius,
    minWidth: 50,
    alignItems: 'center',
  },
  devToggleSwitchOn: {
    backgroundColor: colors.status.success,
  },
  devToggleSwitchText: {
    ...typography.styles.caption,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
  devDiagnosticsButton: {
    marginTop: spacing.md,
  },
});
