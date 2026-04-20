// VIN Barcode + OCR Scanner Screen for VinTraxx SmartScan
// Uses react-native-vision-camera plus react-native-vision-camera-v3-text-recognition
// so we can fall back to OCR when a windshield barcode is damaged or obscured
// (water droplets, glare, worn stickers). Mode is user-toggled.
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  useCameraFormat,
} from 'react-native-vision-camera';
// Text-recognition wrapper: exports its own `Camera` forwardRef with an OCR
// callback + frame processor. We alias it here to keep the barcode path clear.
import { Camera as OcrCamera } from 'react-native-vision-camera-v3-text-recognition';
import type { Text as OcrText } from 'react-native-vision-camera-v3-text-recognition/lib/typescript/src/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { debugLogger } from '../services/debug/DebugLogger';
import { storageService } from '../services/storage/StorageService';

type ScanMode = 'barcode' | 'ocr';

interface VinScannerScreenProps {
  navigation: any;
  route: {
    params: {
      onVinScanned: (vin: string) => void;
      /**
       * Optional preferred starting mode. Defaults to 'barcode' because it's
       * fast and exact; user can flip to OCR if the barcode is damaged.
       */
      initialMode?: ScanMode;
    };
  };
}

// VIN transliteration values for check digit calculation (ISO 3779)
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

// Barcode set: kept broad — some VIN stickers use PDF417/ITF in addition to
// the standard Code 39 / Code 128.
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

const CONSENSUS_THRESHOLD = 2; // require N identical reads when check digit fails

export const VinScannerScreen: React.FC<VinScannerScreenProps> = ({ navigation, route }) => {
  const { onVinScanned, initialMode = 'barcode' } = route.params;
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  // Request a high-resolution format — bumps barcode & OCR accuracy at the
  // cost of a bit more CPU. Fallback is automatic if no matching format exists.
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
    { photoResolution: { width: 1920, height: 1080 } },
    { fps: 30 },
  ]);

  const [scanMode, setScanMode] = useState<ScanMode>(initialMode);
  const [scannedVin, setScannedVin] = useState<string | null>(null);
  const [editableVin, setEditableVin] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [checkDigitValid, setCheckDigitValid] = useState(true);

  const cameraRef = useRef<VisionCamera>(null);
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldownMs = 600;
  const scanVotesRef = useRef<Map<string, number>>(new Map());

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
    debugLogger.logEvent('VIN Scanner: Screen opened', { mode: scanMode });
    if (!hasPermission) {
      requestPermission().then(granted => {
        debugLogger.logEvent('VIN Scanner: Camera permission', { granted });
      });
    }
    // Reset consensus votes when switching modes so a barcode "vote" doesn't
    // bleed into the OCR session (and vice versa).
    scanVotesRef.current.clear();
  }, [hasPermission, requestPermission, scanMode]);

  // ── Shared acceptance path (barcode OR OCR) ────────────────────────────
  const acceptVin = useCallback(
    (
      vin: string,
      codeType: string,
      rawValue: string,
      method: string,
      source: 'camera' | 'ocr',
    ) => {
      const valid = isValidVinCheckDigit(vin);
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
        source,
      });
      // Cache in recent-VINs so the Appraiser/Schedule chips pick it up
      // immediately, regardless of whether the user confirms or rescans.
      storageService.addRecentVin({ vin, source });
    },
    [],
  );

  // Core VIN extraction + consensus voting. Shared by both scan modes so
  // behaviour is identical regardless of whether the input is a barcode or
  // OCR text block.
  const tryAcceptCandidate = useCallback(
    (raw: string, codeType: string, method: string, source: 'camera' | 'ocr') => {
      const cleaned = raw.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();

      let candidate: string | null = null;
      if (isValidVinFormat(cleaned)) {
        candidate = cleaned;
      } else {
        // Barcodes often embed the VIN inside a larger string (e.g. "I ABC...VIN...XYZ")
        const vinMatch = cleaned.match(/[A-HJ-NPR-Z0-9]{17}/);
        if (vinMatch) candidate = vinMatch[0];
      }
      if (!candidate) return false;

      if (isValidVinCheckDigit(candidate)) {
        acceptVin(candidate, codeType, raw, method, source);
        return true;
      }

      // Consensus voting for weak reads (check digit failed but the scanner
      // keeps reporting the same thing → probably correct despite the digit).
      const votes = scanVotesRef.current;
      const count = (votes.get(candidate) || 0) + 1;
      votes.set(candidate, count);

      debugLogger.logEvent('VIN Scanner: candidate (check digit failed, voting)', {
        vin: candidate,
        votes: count,
        threshold: CONSENSUS_THRESHOLD,
        codeType,
        source,
      });

      if (count >= CONSENSUS_THRESHOLD) {
        acceptVin(candidate, codeType, raw, `VIN accepted via consensus (${count} votes)`, source);
        return true;
      }
      return false;
    },
    [acceptVin],
  );

  // ── Barcode scanner (react-native-vision-camera) ──────────────────────
  const codeScanner = useCodeScanner({
    // @ts-expect-error — widened type list is safe; library accepts any string
    codeTypes: VIN_CODE_TYPES,
    onCodeScanned: (codes) => {
      if (isProcessing || scannedVin) return;
      const now = Date.now();
      if (now - lastScanTimeRef.current < scanCooldownMs) return;
      lastScanTimeRef.current = now;

      for (const code of codes) {
        const value = code.value;
        if (!value) continue;
        if (tryAcceptCandidate(value, code.type, 'VIN detected (barcode)', 'camera')) return;
      }
    },
  });

  // ── OCR handler (react-native-vision-camera-v3-text-recognition) ──────
  // The library delivers text blocks in a `{0:{...},1:{...},...}` shape. We
  // iterate all block/line/elementText fields, looking for the first valid
  // 17-char VIN (check digit preferred, consensus otherwise).
  const handleOcrResult = useCallback(
    (data: OcrText) => {
      if (isProcessing || scannedVin) return;
      const now = Date.now();
      if (now - lastScanTimeRef.current < scanCooldownMs) return;
      lastScanTimeRef.current = now;

      // data is keyed by numeric indices; grab the top-level `resultText` if
      // present, else iterate the blocks.
      const candidates: string[] = [];
      const top = (data as any)?.resultText as string | undefined;
      if (top) candidates.push(top);
      for (const key of Object.keys(data)) {
        const block: any = (data as any)[key];
        if (!block) continue;
        if (typeof block === 'string') {
          candidates.push(block);
          continue;
        }
        if (block.blockText) candidates.push(block.blockText);
        if (block.lineText) candidates.push(block.lineText);
        if (block.elementText) candidates.push(block.elementText);
      }

      for (const text of candidates) {
        if (tryAcceptCandidate(text, 'text-recognition', 'VIN detected (OCR)', 'ocr')) return;
      }
    },
    [isProcessing, scannedVin, tryAcceptCandidate],
  );

  // ── Tap-to-focus ──────────────────────────────────────────────────────
  const handleCameraTap = useCallback(
    async (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      try {
        const { locationX, locationY } = event.nativeEvent;
        await cameraRef.current?.focus({ x: locationX, y: locationY });
        debugLogger.logEvent('VIN Scanner: tap to focus', { x: locationX, y: locationY });
      } catch (err) {
        // Some devices don't support focus() — log but don't alert.
        debugLogger.logEvent('VIN Scanner: focus failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [],
  );

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
    debugLogger.logEvent('VIN Scanner: Rescan requested', { mode: scanMode });
    setScannedVin(null);
    setEditableVin('');
    setIsProcessing(false);
    setCheckDigitValid(true);
    scanVotesRef.current.clear();
  }, [scanMode]);

  const handleClose = useCallback(() => {
    debugLogger.logEvent('VIN Scanner: Closed without scan');
    navigation.goBack();
  }, [navigation]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const toggleMode = useCallback(() => {
    setScanMode((prev) => {
      const next = prev === 'barcode' ? 'ocr' : 'barcode';
      debugLogger.logEvent('VIN Scanner: mode toggled', { from: prev, to: next });
      return next;
    });
  }, []);

  // ── Render: permission / device / main ────────────────────────────────
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            VTSmartScan needs camera access to scan VIN barcodes or read VIN text.
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
          <Text style={styles.permissionText}>Unable to find a camera device on this phone.</Text>
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
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleCameraTap}
      >
        {scanMode === 'barcode' ? (
          <VisionCamera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            format={format}
            isActive={isActive}
            codeScanner={codeScanner}
            torch={torchOn ? 'on' : 'off'}
          />
        ) : (
          // OCR camera — the library forwards standard CameraProps through.
          // `callback` fires for every processed frame that contains text.
          <OcrCamera
            ref={cameraRef as any}
            style={StyleSheet.absoluteFill}
            device={device}
            format={format}
            isActive={isActive}
            torch={torchOn ? 'on' : 'off'}
            options={{ language: 'latin' }}
            callback={handleOcrResult}
          />
        )}
      </TouchableOpacity>

      {/* Overlay */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top bar */}
        <SafeAreaView edges={['top']}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleClose} style={styles.topBarButton}>
              <Text style={styles.topBarButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>
              {scanMode === 'barcode' ? 'Scan VIN Barcode' : 'Read VIN Text'}
            </Text>
            <TouchableOpacity
              onPress={() => setTorchOn(!torchOn)}
              style={[styles.topBarButton, torchOn && styles.torchActive]}
            >
              <Text style={styles.topBarButtonText}>{torchOn ? '💡 ON' : '💡 OFF'}</Text>
            </TouchableOpacity>
          </View>

          {/* Mode toggle segmented control */}
          <View style={styles.modeToggleWrap}>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]}
              onPress={() => scanMode !== 'barcode' && toggleMode()}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeButtonText, scanMode === 'barcode' && styles.modeButtonTextActive]}>
                Barcode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'ocr' && styles.modeButtonActive]}
              onPress={() => scanMode !== 'ocr' && toggleMode()}
              activeOpacity={0.8}
            >
              <Text style={[styles.modeButtonText, scanMode === 'ocr' && styles.modeButtonTextActive]}>
                Text (OCR)
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scan area with darkened mask overlay */}
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
            {scannedVin
              ? '✅ VIN detected!'
              : scanMode === 'barcode'
                ? 'Hold steady — align the VIN barcode within the frame'
                : 'Hold steady — point at the printed 17-char VIN text'}
          </Text>
          <Text style={styles.scanHintSub}>
            {scannedVin ? ' ' : 'Tap screen to focus · Toggle Barcode/OCR above'}
          </Text>
        </View>

        {/* Bottom section */}
        <SafeAreaView edges={['bottom']}>
          <View style={styles.bottomSection}>
            {scannedVin ? (
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
            ) : (
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsText}>
                  {scanMode === 'barcode'
                    ? 'Point camera at the VIN barcode on the doorjamb, windshield, or registration.'
                    : 'Aim at the printed VIN — dashboard plate, doorjamb label, or title document.'}
                </Text>
                <Text style={styles.supportedFormats}>
                  {scanMode === 'barcode'
                    ? 'Supports: Code 128, Code 39, Code 93, ITF, PDF417, QR, Data Matrix, Aztec'
                    : 'OCR reads printed text — best results with sharp focus and good lighting'}
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
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between' },
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
  topBarButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  topBarTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  torchActive: { backgroundColor: 'rgba(255,200,0,0.4)' },

  modeToggleWrap: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  modeButtonText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modeButtonTextActive: {
    color: colors.primary.navy,
  },

  scanAreaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  maskOverlay: { flex: 1, width: '100%', backgroundColor: 'rgba(0,0,0,0.55)' },
  scanMiddleRow: { flexDirection: 'row', height: 180 },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanArea: {
    width: 320,
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: spacing.lg,
  },
  scanHintSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.lg,
  },

  bottomSection: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
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
