// DeviceSetupScreen for VinTraxx SmartScan
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { useAppStore } from '../store/appStore';
import { authService } from '../services/auth/AuthService';
import { scannerService } from '../services/scanner/ScannerService';
import { logger, LogCategory } from '../utils/Logger';
import { BleDevice, BleConnectionState } from '../services/ble/types';

// Import SVG icons
import OBD2Icon from '../assets/icons/obd2.svg';
import ConnectIcon from '../assets/icons/connect.svg';
import CheckIcon from '../assets/icons/check.svg';

interface DeviceSetupScreenProps {
  navigation: any;
}

export const DeviceSetupScreen: React.FC<DeviceSetupScreenProps> = ({ navigation }) => {
  const [deviceName, setDeviceName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<BleDevice | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDevice[]>([]);

  const {
    user,
    connectionState,
    setUserDevice,
    setDeviceSetupCompleted,
    setSelectedBleDevice,
    setConnectionState,
  } = useAppStore();

  const isConnected = connectionState === BleConnectionState.CONNECTED;

  // Subscribe to connection state changes
  useEffect(() => {
    const unsubscribe = scannerService.onConnectionStateChange((state) => {
      logger.info(LogCategory.APP, `Device setup - connection state changed: ${state}`);
      setConnectionState(state);

      // If connected and device is named, complete setup
      if (state === BleConnectionState.CONNECTED && deviceName && selectedDevice) {
        completeDeviceSetup();
      }
    });
    return () => unsubscribe();
  }, [deviceName, selectedDevice, setConnectionState]);

  const completeDeviceSetup = async () => {
    if (!deviceName || !selectedDevice) return;

    try {
      logger.info(LogCategory.APP, 'Completing device setup');
      
      // Save device setup to auth service
      const success = await authService.setupDevice(deviceName, selectedDevice.id);
      
      if (success) {
        setUserDevice({
          id: `device-${Date.now()}`,
          name: deviceName,
          macAddress: selectedDevice.id,
          setupCompletedAt: new Date(),
        });
        setSelectedBleDevice(selectedDevice);
        setIsSetupComplete(true);

        // Set deviceSetupCompleted after a brief delay to show success state
        // RootNavigator will reactively switch to Main screens
        setTimeout(() => {
          setDeviceSetupCompleted(true);
        }, 1500);
      }
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to complete device setup', error);
      Alert.alert('Setup Error', 'Failed to complete device setup. Please try again.');
    }
  };

  const handleScanForDevices = useCallback(async () => {
    logger.info(LogCategory.APP, 'Starting BLE device scan for setup');
    setIsScanning(true);
    setDiscoveredDevices([]);

    try {
      await scannerService.startDeviceScan(
        (devices: BleDevice[]) => {
          logger.debug(LogCategory.APP, `Found ${devices.length} devices during setup`);
          setDiscoveredDevices(devices);
        },
        undefined // No filter - show all devices
      );

      // Stop scanning after 10 seconds
      setTimeout(() => {
        scannerService.stopDeviceScan();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to scan for devices', error);
      setIsScanning(false);
      Alert.alert('Scan Error', 'Failed to scan for devices. Please ensure Bluetooth is enabled.');
    }
  }, []);

  const handleSelectDevice = useCallback(async (device: BleDevice) => {
    if (!deviceName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for your device first.');
      return;
    }

    logger.info(LogCategory.APP, `Connecting to device: ${device.name || device.id}`);
    setSelectedDevice(device);
    setIsConnecting(true);

    try {
      await scannerService.connectToDevice(device.id);
      // Connection success will be detected via the connection state listener
      logger.info(LogCategory.APP, 'Device connection initiated');
      setSelectedBleDevice(device);
    } catch (error) {
      logger.error(LogCategory.APP, 'Failed to connect to device', error);
      Alert.alert('Connection Error', 'Failed to connect to the device. Please try again.');
      setSelectedDevice(null);
      setIsConnecting(false);
    }
  }, [deviceName, setSelectedBleDevice]);

  const handleSkipSetup = useCallback(() => {
    Alert.alert(
      'Skip Device Setup',
      'You can set up your device later from the Connect screen. Continue without device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: () => {
            // Mark device setup as completed to trigger RootNavigator to show Main screens
            setDeviceSetupCompleted(true);
          },
        },
      ]
    );
  }, [setDeviceSetupCompleted]);

  if (isSetupComplete) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <CheckIcon width={60} height={60} color={colors.text.inverse} />
          </View>
          <Text style={styles.successTitle}>Setup Complete!</Text>
          <Text style={styles.successSubtitle}>
            Your device "{deviceName}" has been successfully configured
          </Text>
          <ActivityIndicator 
            color={colors.primary.navy} 
            size="large" 
            style={styles.loader}
          />
          <Text style={styles.redirectText}>
            Redirecting to scanner...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Set Up Your OBD-II Device</Text>
          <Text style={styles.headerSubtitle}>
            Name your device and connect it to start scanning
          </Text>
        </View>

        {/* Step 1: Name Your Device */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Name Your Device</Text>
          </View>
          <View style={styles.stepContent}>
            <TextInput
              style={styles.input}
              placeholder="e.g., My Car Scanner"
              placeholderTextColor={colors.text.muted}
              value={deviceName}
              onChangeText={setDeviceName}
              maxLength={30}
            />
            <Text style={styles.inputHint}>
              Choose a friendly name to identify your OBD-II device
            </Text>
          </View>
        </View>

        {/* Step 2: Connect Device */}
        <View style={styles.stepSection}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>Connect Your Device</Text>
          </View>
          <View style={styles.stepContent}>
            <Button
              title={isScanning ? 'Scanning...' : 'Scan for Devices'}
              onPress={handleScanForDevices}
              variant="primary"
              size="large"
              fullWidth
              loading={isScanning}
              disabled={isScanning || !deviceName.trim()}
            />
            {!deviceName.trim() && (
              <Text style={styles.warningText}>
                Please enter a device name first
              </Text>
            )}
          </View>
        </View>

        {/* Device List */}
        {discoveredDevices.length > 0 && (
          <View style={styles.deviceListSection}>
            <Text style={styles.deviceListTitle}>Available Devices</Text>
            {discoveredDevices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceItem,
                  selectedDevice?.id === device.id && styles.deviceItemSelected,
                ]}
                onPress={() => handleSelectDevice(device)}
                disabled={isConnecting}
              >
                <View style={styles.deviceInfo}>
                  <OBD2Icon width={24} height={24} color={colors.primary.navy} />
                  <View style={styles.deviceText}>
                    <Text style={styles.deviceName}>
                      {device.name || 'Unknown Device'}
                    </Text>
                    <Text style={styles.deviceId}>{device.id}</Text>
                    {device.rssi !== null && (
                      <Text style={styles.deviceRssi}>
                        Signal: {device.rssi} dBm
                      </Text>
                    )}
                  </View>
                </View>
                {selectedDevice?.id === device.id && isConnecting && (
                  <ActivityIndicator color={colors.primary.navy} size="small" />
                )}
                {selectedDevice?.id === device.id && isConnected && (
                  <CheckIcon width={24} height={24} color={colors.status.success} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Skip Setup Option */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipSetup}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>Setup Instructions</Text>
          <Text style={styles.instructionItem}>
            1. Make sure your OBD-II device is plugged into your vehicle
          </Text>
          <Text style={styles.instructionItem}>
            2. Turn on your vehicle's ignition (engine can be off)
          </Text>
          <Text style={styles.instructionItem}>
            3. Ensure Bluetooth is enabled on your phone
          </Text>
          <Text style={styles.instructionItem}>
            4. Select your device from the list above
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingBottom: spacing['3xl'],
  },
  header: {
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.styles.h2,
    color: colors.primary.navy,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
  },
  stepSection: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    marginBottom: spacing.lg,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.styles.body,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
  },
  stepTitle: {
    ...typography.styles.h4,
    color: colors.text.primary,
  },
  stepContent: {
    marginLeft: 44, // 32px (step number width) + 12px (margin)
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: spacing.inputRadius,
    paddingHorizontal: spacing.md,
    ...typography.styles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    marginBottom: spacing.xs,
  },
  inputHint: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  warningText: {
    ...typography.styles.caption,
    color: colors.status.warning,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  deviceListSection: {
    marginBottom: spacing.lg,
  },
  deviceListTitle: {
    ...typography.styles.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  deviceItem: {
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.inputRadius,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  deviceItemSelected: {
    borderColor: colors.primary.navy,
    backgroundColor: colors.primary.navy + '10',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  deviceName: {
    ...typography.styles.body,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  deviceId: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  deviceRssi: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: 2,
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    ...typography.styles.body,
    color: colors.text.muted,
    textDecorationLine: 'underline',
  },
  instructionsCard: {
    backgroundColor: colors.status.infoLight,
    borderRadius: spacing.cardRadius,
    padding: spacing.cardPadding,
    marginTop: spacing.lg,
  },
  instructionsTitle: {
    ...typography.styles.h4,
    color: colors.primary.navy,
    marginBottom: spacing.sm,
  },
  instructionItem: {
    ...typography.styles.caption,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.styles.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loader: {
    marginTop: spacing.lg,
  },
  redirectText: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: spacing.md,
  },
});
