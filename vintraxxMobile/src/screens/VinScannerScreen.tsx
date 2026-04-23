// VIN Barcode Scanner Screen for VinTraxx SmartScan.
//
// Intentionally SINGLE MODE (barcode). The previous build offered a
// barcode/OCR toggle backed by react-native-vision-camera-v3-text-recognition,
// but that library's frame-processor pipeline hard-crashes the app on
// React Native 0.83 + New Architecture (Fabric) when the OcrCamera is
// mounted — which is exactly what the user reported on the "Text (OCR)"
// tab. We removed the toggle to stop the crash; a follow-up PR will reintroduce
// OCR via a photo-based library (e.g. @react-native-ml-kit/text-recognition)
// wired through the `handleOcrFallback` seam below.
//
// UX matches LaserAppraiser: full-screen camera, dark mask, horizontal red
// scan line animated inside a rectangular crop, torch + camera-switch +
// close buttons, a minimal "Scan barcodes or VIN" hint, and a "Type VIN"
// fallback that opens a manual-entry sheet.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Platform,
  Linking,
  Vibration,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  useCameraFormat,
} from 'react-native-vision-camera';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { debugLogger } from '../services/debug/DebugLogger';
import { storageService } from '../services/storage/StorageService';

interface VinScannerScreenProps {
  navigation: any;
  route: {
    params: {
      onVinScanned: (vin: string) => void;
    };
  };
}

// ── VIN validation helpers ────────────────────────────────────────────
// ISO 3779 transliteration table + weight vector for the mod-11 check
// digit. Kept verbatim from the previous implementation because it was
// already correct — we just moved it above the component.
const VIN_TRANSLITERATE: Record<string, number> = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
  'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
};
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

const isValidVinCheckDigit = (vin: string): boolean => {
  if (vin.length !== 17) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const val = VIN_TRANSLITERATE[vin[i]];
    if (val === undefined) return false;
    sum += val * VIN_WEIGHTS[i];
  }
  const remainder = sum % 11;
  const checkChar = remainder === 10 ? 'X' : String(remainder);
  return vin[8] === checkChar;
};

const isValidVinFormat = (vin: string): boolean => {
  const cleaned = vin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
  return cleaned.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(cleaned);
};

// Broad barcode support — VIN stickers commonly use Code 39 / Code 128
// on doorjambs and PDF417 / Data Matrix on windshields and titles.
const VIN_CODE_TYPES = [
  'code-128',
  'code-39',
  'code-93',
  'codabar',
  'ean-13',
  'ean-8',
  'itf',
  'pdf-417',
  'qr',
  'data-matrix',
  'aztec',
  'upc-a',
  'upc-e',
] as const;

const CONSENSUS_THRESHOLD = 2;

// ── ErrorBoundary ─────────────────────────────────────────────────────
// Native-side camera failures (device init, frame processor, etc.) can
// throw during render. Without a boundary the whole app unmounts and the
// debug log is lost. This boundary flushes the log to disk synchronously
// and shows a friendly retry screen.
interface BoundaryState { hasError: boolean; errorMessage: string }
class VinScannerErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void },
  BoundaryState
> {
  state: BoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { hasError: true, errorMessage: error.message || 'Unknown camera error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    debugLogger.logError('VIN Scanner: crash boundary caught', error, {
      componentStack: info.componentStack,
    });
    debugLogger.persistLogs().catch(() => {});
  }

  handleRetry = () => {
    debugLogger.logEvent('VIN Scanner: crash boundary retry');
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Error</Text>
          <Text style={styles.permissionText}>
            The scanner encountered a problem and stopped safely.{'\n\n'}
            {this.state.errorMessage}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={this.handleRetry}>
            <Text style={styles.permissionButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButtonAlt} onPress={this.props.onClose}>
            <Text style={styles.closeButtonAltText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

// ── Main screen ───────────────────────────────────────────────────────
const VinScannerScreenInner: React.FC<VinScannerScreenProps> = ({ navigation, route }) => {
  const { onVinScanned } = route.params;
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);

  // High-res format helps barcode scanners read dense Code 39 VINs at
  // arm's length. Library falls back automatically if no match.
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
    { photoResolution: { width: 1920, height: 1080 } },
    { fps: 30 },
  ]);

  const [scannedVin, setScannedVin] = useState<string | null>(null);
  const [editableVin, setEditableVin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [checkDigitValid, setCheckDigitValid] = useState(true);
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [manualVinInput, setManualVinInput] = useState('');

  const cameraRef = useRef<VisionCamera>(null);
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldownMs = 600;
  const scanVotesRef = useRef<Map<string, number>>(new Map());
  const mountedAtRef = useRef<number>(Date.now());
  // Throttle frame-level logs to once/second so the debug log stays readable.
  const lastFrameLogRef = useRef<number>(0);
  const vinAcceptedRef = useRef<boolean>(false);

  // ── Animated scan line ─────────────────────────────────────────────
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineAnim]);

  // ── Lifecycle + permission ─────────────────────────────────────────
  useEffect(() => {
    mountedAtRef.current = Date.now();
    debugLogger.logEvent('VIN Scanner: mount', {
      hasPermission,
      platform: Platform.OS,
    });
    if (!hasPermission) {
      requestPermission().then((granted) => {
        debugLogger.logEvent('VIN Scanner: camera permission result', { granted });
      });
    }
    return () => {
      debugLogger.logEvent('VIN Scanner: unmount', {
        vinAccepted: vinAcceptedRef.current,
        durationMs: Date.now() - mountedAtRef.current,
      });
    };
    // Intentionally only on mount — permission side-effects guarded above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Log once when the camera device/format resolves so we can diagnose
  // missing-format or low-fps issues in the field. Format property names
  // have varied between vision-camera major versions, so we read through
  // `any` to keep this log resilient across upgrades.
  useEffect(() => {
    if (!device) return;
    const fmt = format as any;
    debugLogger.logEvent('VIN Scanner: camera device selected', {
      position: cameraPosition,
      deviceId: device.id,
      hasTorch: device.hasTorch,
      formatWidth: fmt?.videoWidth ?? fmt?.photoWidth,
      formatHeight: fmt?.videoHeight ?? fmt?.photoHeight,
      formatFps: fmt?.maxFps,
    });
  }, [device, format, cameraPosition]);

  // ── Shared acceptance path ─────────────────────────────────────────
  const acceptVin = useCallback(
    (vin: string, codeType: string, rawValue: string, method: string) => {
      const valid = isValidVinCheckDigit(vin);
      vinAcceptedRef.current = true;
      setIsProcessing(true);
      setScannedVin(vin);
      setEditableVin(vin);
      setCheckDigitValid(valid);
      Vibration.vibrate(100);
      debugLogger.logEvent(`VIN Scanner: ${method}`, {
        vin,
        codeType,
        rawValue,
        checkDigitValid: valid,
      });
      storageService.addRecentVin({ vin, source: 'camera' });
    },
    [],
  );

  // Shared candidate extractor — barcode stickers frequently embed the
  // VIN inside a larger string (e.g. `I ABC...<VIN>...XYZ`), so we try an
  // exact match first then scan for a 17-char substring.
  const tryAcceptCandidate = useCallback(
    (raw: string, codeType: string, method: string) => {
      const cleaned = raw.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();

      let candidate: string | null = null;
      if (isValidVinFormat(cleaned)) {
        candidate = cleaned;
      } else {
        const vinMatch = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/);
        if (vinMatch) candidate = vinMatch[0];
      }
      if (!candidate) return false;

      if (isValidVinCheckDigit(candidate)) {
        acceptVin(candidate, codeType, raw, method);
        return true;
      }

      // Consensus voting — some scanners mis-read one character; if the
      // same bad-check-digit VIN comes back N times we accept it but flag
      // the check digit as invalid so the user verifies.
      const votes = scanVotesRef.current;
      const count = (votes.get(candidate) || 0) + 1;
      votes.set(candidate, count);
      debugLogger.logEvent('VIN Scanner: candidate (check digit failed, voting)', {
        vin: candidate,
        votes: count,
        threshold: CONSENSUS_THRESHOLD,
        codeType,
      });
      if (count >= CONSENSUS_THRESHOLD) {
        acceptVin(candidate, codeType, raw, `VIN accepted via consensus (${count} votes)`);
        return true;
      }
      return false;
    },
    [acceptVin],
  );

  // ── Barcode scanner ───────────────────────────────────────────────
  const codeScanner = useCodeScanner({
    // @ts-expect-error — widened type list; library accepts any string.
    codeTypes: VIN_CODE_TYPES,
    onCodeScanned: (codes) => {
      if (isProcessing || scannedVin) return;
      const now = Date.now();
      if (now - lastScanTimeRef.current < scanCooldownMs) return;
      lastScanTimeRef.current = now;

      // Throttled frame log for debugging — one entry per second max,
      // includes first code type + first value so we can see what the
      // scanner is actually picking up.
      if (now - lastFrameLogRef.current > 1000) {
        lastFrameLogRef.current = now;
        debugLogger.logEvent('VIN Scanner: barcode frame', {
          codeCount: codes.length,
          codeTypes: codes.map((c) => c.type).slice(0, 3),
          firstValue: codes[0]?.value?.slice(0, 40),
        });
      }

      for (const code of codes) {
        const value = code.value;
        if (!value) continue;
        if (tryAcceptCandidate(value, code.type, 'VIN detected (barcode)')) return;
      }
    },
  });

  // ── Tap-to-focus ──────────────────────────────────────────────────
  const handleCameraTap = useCallback(
    async (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      try {
        const { locationX, locationY } = event.nativeEvent;
        await cameraRef.current?.focus({ x: locationX, y: locationY });
      } catch (err) {
        debugLogger.logEvent('VIN Scanner: focus failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [],
  );

  // ── Actions ───────────────────────────────────────────────────────
  const handleConfirmVin = useCallback(() => {
    const finalVin = editableVin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    if (finalVin && isValidVinFormat(finalVin)) {
      debugLogger.logEvent('VIN Scanner: VIN confirmed by user', {
        vin: finalVin,
        wasEdited: finalVin !== scannedVin,
        checkDigitValid: isValidVinCheckDigit(finalVin),
      });
      storageService.addRecentVin({ vin: finalVin, source: 'manual' });
      onVinScanned(finalVin);
      navigation.goBack();
    } else {
      Alert.alert('Invalid VIN', 'Please enter a valid 17-character VIN.');
    }
  }, [editableVin, scannedVin, onVinScanned, navigation]);

  const handleRescan = useCallback(() => {
    debugLogger.logEvent('VIN Scanner: rescan requested');
    setScannedVin(null);
    setEditableVin('');
    setIsProcessing(false);
    setCheckDigitValid(true);
    scanVotesRef.current.clear();
  }, []);

  const handleClose = useCallback(() => {
    debugLogger.logEvent('VIN Scanner: closed without scan');
    navigation.goBack();
  }, [navigation]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const handleFlipCamera = useCallback(() => {
    setCameraPosition((prev) => {
      const next = prev === 'back' ? 'front' : 'back';
      debugLogger.logEvent('VIN Scanner: camera flipped', { from: prev, to: next });
      return next;
    });
  }, []);

  const handleTypeVin = useCallback(() => {
    debugLogger.logEvent('VIN Scanner: manual entry opened');
    setManualVinInput('');
    setManualEntryVisible(true);
  }, []);

  const handleManualSubmit = useCallback(() => {
    const cleaned = manualVinInput.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
    if (!isValidVinFormat(cleaned)) {
      Alert.alert('Invalid VIN', 'Please enter a valid 17-character VIN.');
      return;
    }
    debugLogger.logEvent('VIN Scanner: manual VIN submitted', {
      vin: cleaned,
      checkDigitValid: isValidVinCheckDigit(cleaned),
    });
    storageService.addRecentVin({ vin: cleaned, source: 'manual' });
    setManualEntryVisible(false);
    onVinScanned(cleaned);
    navigation.goBack();
  }, [manualVinInput, onVinScanned, navigation]);

  // ── Guard screens ─────────────────────────────────────────────────
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

  const isActive = !scannedVin;

  return (
    <View style={styles.container}>
      {/* Camera preview (fills the screen) */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleCameraTap}
      >
        <VisionCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          format={format}
          isActive={isActive}
          codeScanner={codeScanner}
          torch={torchOn ? 'on' : 'off'}
        />
      </TouchableOpacity>

      {/* Overlay — mask + corners + scan line + buttons */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top bar — close button on the right (LaserAppraiser style) */}
        <SafeAreaView edges={['top']} pointerEvents="box-none">
          <View style={styles.topBar}>
            <View style={styles.topBarSpacer} />
            <Text style={styles.topBarTitle}>Scan VIN</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeCircle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close scanner"
            >
              <Text style={styles.closeCircleText}>×</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan crop — dark mask above/below/sides, clear centre rectangle */}
        <View style={styles.scanAreaContainer}>
          <View style={styles.maskOverlay} />
          <View style={styles.scanMiddleRow}>
            <View style={styles.maskSide} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {!scannedVin && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      transform: [
                        {
                          translateY: scanLineAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-80, 80],
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
          <View style={styles.maskOverlay} />

          <Text style={styles.scanHint}>
            {scannedVin ? 'VIN detected' : 'Scan barcodes or VIN'}
          </Text>
          {!scannedVin && (
            <Text style={styles.scanHintSub}>
              Align the VIN barcode within the frame · Tap to focus
            </Text>
          )}
        </View>

        {/* Bottom section — action buttons OR result editor */}
        <SafeAreaView edges={['bottom']} pointerEvents="box-none">
          {scannedVin ? (
            <View style={styles.bottomSection}>
              <View style={styles.resultContainer}>
                <Text style={styles.resultLabel}>Scanned VIN</Text>
                <TextInput
                  style={styles.resultVinInput}
                  value={editableVin}
                  onChangeText={(text) => {
                    const upper = text.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
                    setEditableVin(upper);
                    setCheckDigitValid(isValidVinCheckDigit(upper));
                  }}
                  maxLength={17}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  selectTextOnFocus
                />
                {!checkDigitValid && (
                  <Text style={styles.checkDigitWarning}>
                    VIN check digit invalid — verify before confirming
                  </Text>
                )}
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
            </View>
          ) : (
            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                onPress={() => setTorchOn((v) => !v)}
                style={[styles.actionPill, torchOn && styles.actionPillActive]}
                activeOpacity={0.8}
                accessibilityLabel="Toggle flashlight"
              >
                <Text style={styles.actionPillIcon}>{torchOn ? '●' : '○'}</Text>
                <Text style={styles.actionPillLabel}>
                  {torchOn ? 'Light On' : 'Light Off'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleTypeVin}
                style={styles.actionPill}
                activeOpacity={0.8}
                accessibilityLabel="Type VIN manually"
              >
                <Text style={styles.actionPillIcon}>⌨</Text>
                <Text style={styles.actionPillLabel}>Type VIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFlipCamera}
                style={styles.actionPill}
                activeOpacity={0.8}
                accessibilityLabel="Flip camera"
              >
                <Text style={styles.actionPillIcon}>⟳</Text>
                <Text style={styles.actionPillLabel}>Flip</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* Manual entry modal — "Type VIN" fallback path */}
      <Modal
        visible={manualEntryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualEntryVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter VIN</Text>
            <Text style={styles.modalSubtitle}>17 characters, no I, O, or Q</Text>
            <TextInput
              style={styles.modalInput}
              value={manualVinInput}
              onChangeText={(text) =>
                setManualVinInput(text.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase())
              }
              placeholder="e.g. 1HGBH41JXMN109186"
              placeholderTextColor="#B0B8C4"
              maxLength={17}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setManualEntryVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  !isValidVinFormat(manualVinInput) && styles.modalSubmitButtonDisabled,
                ]}
                onPress={handleManualSubmit}
                disabled={!isValidVinFormat(manualVinInput)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSubmitText}>Use VIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Public component wraps the inner screen with the error boundary so
// native-side camera crashes never take the whole app down.
export const VinScannerScreen: React.FC<VinScannerScreenProps> = (props) => (
  <VinScannerErrorBoundary onClose={() => props.navigation.goBack()}>
    <VinScannerScreenInner {...props} />
  </VinScannerErrorBoundary>
);

// ── Styles ────────────────────────────────────────────────────────────
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;
const SCAN_BOX_WIDTH = 320;
const SCAN_BOX_HEIGHT = 180;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },

  // ── Top bar ────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topBarSpacer: { width: 40, height: 40 },
  topBarTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  closeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary.red || '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  closeCircleText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 28,
    marginTop: -2,
  },

  // ── Scan crop ──────────────────────────────────────────────────────
  scanAreaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  maskOverlay: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.55)' },
  scanMiddleRow: { flexDirection: 'row', height: SCAN_BOX_HEIGHT },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanArea: {
    width: SCAN_BOX_WIDTH,
    height: SCAN_BOX_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderTopColor: '#FFF', borderLeftColor: '#FFF',
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderTopColor: '#FFF', borderRightColor: '#FFF',
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    borderBottomColor: '#FFF', borderLeftColor: '#FFF',
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH,
    borderBottomColor: '#FFF', borderRightColor: '#FFF',
  },
  scanLine: {
    width: '92%',
    height: 2,
    backgroundColor: colors.primary.red || '#FF3B30',
    opacity: 0.9,
    shadowColor: colors.primary.red || '#FF3B30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  scanHint: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.lg,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    paddingHorizontal: spacing.lg,
  },
  scanHintSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: spacing.lg,
  },

  // ── Bottom action bar (idle state) ─────────────────────────────────
  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionPillActive: {
    backgroundColor: 'rgba(255,200,0,0.45)',
    borderColor: 'rgba(255,200,0,0.6)',
  },
  actionPillIcon: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionPillLabel: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  // ── Bottom result editor (after scan) ──────────────────────────────
  bottomSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  resultContainer: {
    backgroundColor: 'rgba(0,0,0,0.82)',
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
  resultVinInput: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    marginBottom: spacing.sm,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.4)',
    paddingVertical: spacing.sm,
    width: '100%',
  },
  checkDigitWarning: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  resultButtons: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  rescanButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  rescanButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.status.success || '#34C759',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // ── Manual entry modal ─────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.5,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  modalSubmitButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: colors.primary.navy,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.5,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },

  // ── Permission / no-device fallbacks ───────────────────────────────
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
  permissionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
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
