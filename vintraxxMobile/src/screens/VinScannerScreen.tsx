// VIN Barcode Scanner Screen for VinTraxx SmartScan
// Uses react-native-vision-camera to scan VIN barcodes via device camera
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Platform,
  Linking,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { debugLogger } from '../services/debug/DebugLogger';

interface VinScannerScreenProps {
  navigation: any;
  route: {
    params: {
      onVinScanned: (vin: string) => void;
    };
  };
}

// VIN validation: 17 alphanumeric chars, no I, O, Q
const isValidVinFormat = (vin: string): boolean => {
  const cleaned = vin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
  return cleaned.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned);
};

export const VinScannerScreen: React.FC<VinScannerScreenProps> = ({ navigation, route }) => {
  const { onVinScanned } = route.params;
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [scannedVin, setScannedVin] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldownMs = 800;

  // Scanning line animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  useEffect(() => {
    debugLogger.logEvent('VIN Scanner: Screen opened');
    if (!hasPermission) {
      requestPermission().then(granted => {
        debugLogger.logEvent('VIN Scanner: Camera permission', { granted });
      });
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['code-128', 'code-39', 'code-93', 'itf', 'qr', 'data-matrix', 'ean-13', 'codabar'],
    onCodeScanned: (codes) => {
      if (isProcessing || scannedVin) return;

      // Debounce: prevent rapid-fire scanning
      const now = Date.now();
      if (now - lastScanTimeRef.current < scanCooldownMs) return;
      lastScanTimeRef.current = now;

      for (const code of codes) {
        const value = code.value;
        if (!value) continue;

        // Try to extract a VIN from the scanned value
        const cleaned = value.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();

        if (isValidVinFormat(cleaned)) {
          setIsProcessing(true);
          setScannedVin(cleaned);
          // Haptic feedback on successful scan
          Vibration.vibrate(100);
          debugLogger.logEvent('VIN Scanner: VIN detected', {
            vin: cleaned,
            codeType: code.type,
            rawValue: value,
          });
          break;
        }

        // Some barcodes embed VIN within a larger string - try to find 17-char VIN pattern
        const vinMatch = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/);
        if (vinMatch) {
          setIsProcessing(true);
          setScannedVin(vinMatch[0]);
          Vibration.vibrate(100);
          debugLogger.logEvent('VIN Scanner: VIN extracted from barcode', {
            vin: vinMatch[0],
            codeType: code.type,
            rawValue: value,
          });
          break;
        }
      }
    },
  });

  const handleConfirmVin = useCallback(() => {
    if (scannedVin) {
      debugLogger.logEvent('VIN Scanner: VIN confirmed by user', { vin: scannedVin });
      onVinScanned(scannedVin);
      navigation.goBack();
    }
  }, [scannedVin, onVinScanned, navigation]);

  const handleRescan = useCallback(() => {
    debugLogger.logEvent('VIN Scanner: Rescan requested');
    setScannedVin(null);
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    debugLogger.logEvent('VIN Scanner: Closed without scan');
    navigation.goBack();
  }, [navigation]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  // Permission not granted
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            VTSmartScan needs camera access to scan VIN barcodes.
            Please grant camera permission in Settings.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleOpenSettings}>
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButtonAlt} onPress={handleClose}>
            <Text style={styles.closeButtonAltText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No camera device available
  if (!device) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>No Camera Found</Text>
          <Text style={styles.permissionText}>
            Unable to find a camera device on this phone.
          </Text>
          <TouchableOpacity style={styles.closeButtonAlt} onPress={handleClose}>
            <Text style={styles.closeButtonAltText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scannedVin}
        codeScanner={codeScanner}
        torch={torchOn ? 'on' : 'off'}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Top bar */}
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleClose} style={styles.topBarButton}>
              <Text style={styles.topBarButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Scan VIN Barcode</Text>
            <TouchableOpacity
              onPress={() => setTorchOn(!torchOn)}
              style={[styles.topBarButton, torchOn && styles.torchActive]}
            >
              <Text style={styles.topBarButtonText}>
                {torchOn ? '💡 ON' : '💡 OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan area with darkened mask overlay */}
        <View style={styles.scanAreaContainer}>
          {/* Dark mask above scan area */}
          <View style={styles.maskOverlay} />
          <View style={styles.scanMiddleRow}>
            <View style={styles.maskSide} />
            <View style={styles.scanArea}>
              {/* Corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {/* Animated scan line */}
              {!scannedVin && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-60, 60],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.maskSide} />
          </View>
          {/* Dark mask below scan area */}
          <View style={styles.maskOverlay} />

          <Text style={styles.scanHint}>
            {scannedVin
              ? '✅ VIN barcode detected!'
              : 'Hold steady — position the VIN barcode within the frame'}
          </Text>
        </View>

        {/* Bottom section */}
        <SafeAreaView edges={['bottom']}>
          <View style={styles.bottomSection}>
            {scannedVin ? (
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Scanned VIN</Text>
                <Text style={styles.resultVin}>{scannedVin}</Text>
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={handleRescan}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rescanButtonText}>Re-scan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmVin}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmButtonText}>Use This VIN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  Point camera at the VIN barcode on the vehicle doorjamb, windshield, or registration document.
                </Text>
                <Text style={styles.supportedFormats}>
                  Supported: Code 128, Code 39, QR Code, Data Matrix
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  topBarButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
  },
  topBarButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  topBarTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  torchActive: {
    backgroundColor: 'rgba(255,200,0,0.4)',
  },

  // Scan area with mask
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanMiddleRow: {
    flexDirection: 'row',
    height: 150,
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanArea: {
    width: 320,
    height: 150,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopColor: '#FFF',
    borderRightColor: '#FFF',
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomColor: '#FFF',
    borderLeftColor: '#FFF',
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomColor: '#FFF',
    borderRightColor: '#FFF',
  },
  scanLine: {
    width: '90%',
    height: 2,
    backgroundColor: colors.primary.red || '#FF3B30',
    opacity: 0.8,
  },
  scanHint: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // Bottom section
  bottomSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  resultContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 16,
    padding: spacing.lg,
    alignItems: 'center',
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  resultVin: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  rescanButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.status.success || '#34C759',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  instructionsContainer: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportedFormats: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // Permission screens
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background.primary,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  permissionButton: {
    backgroundColor: colors.primary.navy,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButtonAlt: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  closeButtonAltText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
});
