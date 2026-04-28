// VIN Barcode + OCR Scanner Screen for VinTraxx SmartScan.
//
// Hybrid detection — barcodes AND printed-text VINs are detected automatically:
//   • `useCodeScanner` (vision-camera) runs continuously for Code 39 / 128 /
//     PDF417 / Data Matrix / QR / EAN / etc.
//   • In parallel, every OCR_INTERVAL_MS the camera silently snaps a still
//     photo and runs @react-native-ml-kit/text-recognition over it. Any
//     17-char VIN substring found in the OCR text is fed through the same
//     candidate / consensus pipeline as barcodes.
//   • First valid VIN wins. Manual "Type VIN" entry is still available as
//     a fallback.
//
// ML Kit is photo-based (Promise on a still image) so it does NOT use the
// vision-camera frame processor — that's why this re-introduces OCR safely
// on RN 0.83 + New Architecture (Fabric). The previous frame-processor
// based attempt (react-native-vision-camera-v3-text-recognition) crashed
// here, which is why it had been removed.
//
// UI: minimalist (Apple Wallet / Google Pay style). No scan-box overlay.
// Floating glass top header (title + close), brand-color corner ticks at
// the focus area, floating status pill, glass bottom dock with three icon
// buttons (torch · type VIN · flip camera), and a tap-to-focus pulse.
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  useCameraFormat,
} from 'react-native-vision-camera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import TextRecognition from '@react-native-ml-kit/text-recognition';
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

// ── OCR loop tuning ───────────────────────────────────────────────────
// Cadence chosen as a balance: fast enough to feel instant once the user
// frames the VIN, slow enough that the camera HW pipeline keeps up and
// battery / heat are not a concern. Empirically ~1.5 s gives the OCR
// engine time to return on mid-range Android devices.
const OCR_INTERVAL_MS = 1500;
// Skip OCR snapshots for this long after camera mount so the autofocus
// + auto-exposure pipeline has time to settle. Snapshots taken before
// settle are blurry and waste a cycle.
const OCR_WARMUP_MS = 800;

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
  // Drives the floating status pill copy ("Reading text…") so the user
  // gets feedback while ML Kit is processing a snapshot.
  const [isOcrInFlight, setIsOcrInFlight] = useState(false);
  // Tap-to-focus pulse location.
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(null);

  const cameraRef = useRef<VisionCamera>(null);
  const lastScanTimeRef = useRef<number>(0);
  const scanCooldownMs = 600;
  const scanVotesRef = useRef<Map<string, number>>(new Map());
  const mountedAtRef = useRef<number>(Date.now());
  // Throttle frame-level logs to once/second so the debug log stays readable.
  const lastFrameLogRef = useRef<number>(0);
  const vinAcceptedRef = useRef<boolean>(false);

  // OCR loop housekeeping — kept in refs so the interval closure can read
  // the latest values without triggering a restart on every state change.
  const ocrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ocrInFlightRef = useRef<boolean>(false);
  const ocrAttemptsRef = useRef<number>(0);
  const scannedVinRef = useRef<string | null>(null);
  const manualEntryVisibleRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  useEffect(() => { scannedVinRef.current = scannedVin; }, [scannedVin]);
  useEffect(() => { manualEntryVisibleRef.current = manualEntryVisible; }, [manualEntryVisible]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  // ── Animations ─────────────────────────────────────────────────────
  // Subtle pulse on the focus corner ticks while idle/scanning.
  const tickPulseAnim = useRef(new Animated.Value(0)).current;
  // Tap-to-focus pulse — expanding ring at the user's last tap location.
  const focusPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tickPulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(tickPulseAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [tickPulseAnim]);

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
        ocrAttempts: ocrAttemptsRef.current,
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

  // ── OCR loop (photo-based ML Kit) ─────────────────────────────────
  // Snaps a still image and runs Latin-script text recognition on it.
  // Photo-based (not frame-processor) so it does NOT trigger the
  // Fabric/New-Architecture crash that disabled the previous OCR path.
  const runOcrSnapshot = useCallback(async () => {
    if (
      ocrInFlightRef.current ||
      isProcessingRef.current ||
      scannedVinRef.current ||
      manualEntryVisibleRef.current
    ) return;
    const cam = cameraRef.current;
    if (!cam) return;
    ocrInFlightRef.current = true;
    setIsOcrInFlight(true);
    ocrAttemptsRef.current += 1;
    try {
      // Use 'off' for the takePhoto flash — the parent <Camera> already
      // drives the torch via the `torch` prop, so a second flash here
      // would wash out OCR and disturb the user.
      const photo = await cam.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      const uri = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;
      const result = await TextRecognition.recognize(uri);
      const fullText =
        result?.text ||
        result?.blocks?.map((b) => b.text).join(' ') ||
        '';
      if (fullText) {
        tryAcceptCandidate(fullText, 'ocr', 'VIN detected (OCR)');
      }
    } catch (err) {
      debugLogger.logEvent('VIN Scanner: OCR snapshot failed', {
        error: err instanceof Error ? err.message : String(err),
        attempt: ocrAttemptsRef.current,
      });
    } finally {
      ocrInFlightRef.current = false;
      setIsOcrInFlight(false);
    }
  }, [tryAcceptCandidate]);

  // Drive the OCR loop. Re-armed any time the camera/permission/scannedVin
  // boundary changes — clears itself when a VIN is accepted so we don't
  // keep waking the camera after success. Uses an initial warmup so the
  // autofocus/auto-exposure pipeline has time to settle.
  useEffect(() => {
    if (!device || !hasPermission) return;
    if (scannedVin) return;
    const warmup = setTimeout(() => {
      ocrIntervalRef.current = setInterval(runOcrSnapshot, OCR_INTERVAL_MS);
    }, OCR_WARMUP_MS);
    return () => {
      clearTimeout(warmup);
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current);
        ocrIntervalRef.current = null;
      }
    };
  }, [device, hasPermission, scannedVin, runOcrSnapshot]);

  // ── Tap-to-focus + visual focus pulse ─────────────────────────────
  const handleCameraTap = useCallback(
    async (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      const { locationX, locationY } = event.nativeEvent;
      setTapPoint({ x: locationX, y: locationY });
      focusPulseAnim.setValue(0);
      Animated.timing(focusPulseAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
      try {
        await cameraRef.current?.focus({ x: locationX, y: locationY });
      } catch (err) {
        debugLogger.logEvent('VIN Scanner: focus failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [focusPulseAnim],
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
          <View style={styles.permissionIconWrap}>
            <Ionicons name="camera-outline" size={36} color={colors.primary.navy} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            VTSmartScan needs camera access to scan VIN barcodes and printed
            VIN labels. Please grant camera permission in Settings.
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
          <View style={styles.permissionIconWrap}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.primary.red} />
          </View>
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

  // Status pill copy/icon driven by current OCR/scan state.
  const statusContent: {
    icon: string;
    label: string;
    tone: 'idle' | 'busy' | 'success';
  } = scannedVin
    ? { icon: 'checkmark-circle', label: 'VIN found', tone: 'success' }
    : isOcrInFlight
    ? { icon: 'scan-outline', label: 'Reading text…', tone: 'busy' }
    : { icon: 'scan-outline', label: 'Looking for VIN…', tone: 'idle' };

  return (
    <View style={styles.container}>
      {/* Camera preview fills the screen. Pressable captures tap-to-focus
          without the extra TouchableOpacity wrapper that used to swallow
          double-taps and activeOpacity flashes. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleCameraTap}>
        <VisionCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          format={format}
          isActive={isActive}
          codeScanner={codeScanner}
          torch={torchOn ? 'on' : 'off'}
          photo={true}
        />
      </Pressable>

      {/* Tap-to-focus pulse — soft expanding ring at the touch point. */}
      {tapPoint && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.focusPulse,
            {
              left: tapPoint.x - 36,
              top: tapPoint.y - 36,
              opacity: focusPulseAnim.interpolate({
                inputRange: [0, 0.2, 1],
                outputRange: [0, 0.9, 0],
              }),
              transform: [
                {
                  scale: focusPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.5],
                  }),
                },
              ],
            },
          ]}
        />
      )}

      {/* Soft vignette layers keep overlay UI legible without the harsh
          boxed dark mask that used to hide most of the preview. The bands
          are intentionally thin and fade inward — they must NOT creep into
          the viewfinder / status-pill area, which was the root cause of
          the "messy overlap" layout reported during field testing. */}
      <View pointerEvents="none" style={styles.topVignette} />
      <View pointerEvents="none" style={styles.bottomVignette} />

      {/* Overlay UI: glass top header, center ticks+status (one flow), glass dock.
          No absolute-positioned status pill — everything lives in the normal
          flex flow so the dock can never eat the helper text. */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* ── Top header (glass) ─────────────────────────────────────── */}
        <SafeAreaView edges={['top']} pointerEvents="box-none">
          <View style={styles.topHeader}>
            <Text style={styles.topHeaderTitle}>Scan VIN</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.headerCloseButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close scanner"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* ── Center: corner ticks + status pill as a single vertical stack ─ */}
        <View style={styles.centerArea} pointerEvents="box-none">
          {!scannedVin && (
            <Animated.View
              style={[
                styles.cornerTickWrap,
                {
                  opacity: tickPulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.55, 1],
                  }),
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.tick, styles.tickTL]} />
              <View style={[styles.tick, styles.tickTR]} />
              <View style={[styles.tick, styles.tickBL]} />
              <View style={[styles.tick, styles.tickBR]} />
            </Animated.View>
          )}

          <View style={styles.statusPillWrap} pointerEvents="none">
            <View
              style={[
                styles.statusPill,
                statusContent.tone === 'success' && styles.statusPillSuccess,
                statusContent.tone === 'busy' && styles.statusPillBusy,
              ]}
            >
              {statusContent.tone === 'busy' ? (
                <ActivityIndicator size="small" color="#FFF" style={styles.statusSpinner} />
              ) : (
                <Ionicons
                  name={statusContent.icon}
                  size={16}
                  color="#FFF"
                />
              )}
              <Text style={styles.statusPillText}>{statusContent.label}</Text>
            </View>
            {!scannedVin && (
              <Text style={styles.helperText}>
                Point at the VIN barcode or label · Tap to focus
              </Text>
            )}
          </View>
        </View>

        {/* ── Bottom: glass dock OR result card ─────────────────────── */}
        <SafeAreaView edges={['bottom']} pointerEvents="box-none">
          {scannedVin ? (
            <View style={styles.bottomSection}>
              <View style={styles.resultCard}>
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
                  <View style={styles.checkDigitWarningRow}>
                    <Ionicons name="warning" size={14} color="#FFD60A" />
                    <Text style={styles.checkDigitWarning}>
                      VIN check digit invalid — verify before confirming
                    </Text>
                  </View>
                )}
                <View style={styles.resultButtons}>
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={handleRescan}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={16} color="#FFF" />
                    <Text style={styles.rescanButtonText}>Re-scan</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmVin}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Use This VIN</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.bottomDockWrap} pointerEvents="box-none">
              <View style={styles.bottomDock}>
                <DockButton
                  icon={torchOn ? 'flashlight' : 'flashlight-outline'}
                  label={torchOn ? 'Light On' : 'Light Off'}
                  active={torchOn}
                  onPress={() => setTorchOn((v) => !v)}
                  accessibilityLabel="Toggle flashlight"
                />
                <DockButton
                  icon="keypad-outline"
                  label="Type VIN"
                  onPress={handleTypeVin}
                  accessibilityLabel="Type VIN manually"
                />
                <DockButton
                  icon="camera-reverse-outline"
                  label="Flip"
                  onPress={handleFlipCamera}
                  accessibilityLabel="Flip camera"
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* Manual entry bottom sheet — "Type VIN" fallback path */}
      <Modal
        visible={manualEntryVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManualEntryVisible(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setManualEntryVisible(false)}
        >
          {/* Inner Pressable absorbs taps so tapping inside the sheet
              does not dismiss the modal via the backdrop handler. */}
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <View style={styles.sheetGrabber} />
            <Text style={styles.sheetTitle}>Enter VIN manually</Text>
            <Text style={styles.sheetSubtitle}>
              17 characters · letters and digits · no I, O, or Q
            </Text>
            <TextInput
              style={styles.sheetInput}
              value={manualVinInput}
              onChangeText={(text) =>
                setManualVinInput(text.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase())
              }
              placeholder="e.g. 1HGBH41JXMN109186"
              placeholderTextColor={colors.text.muted}
              maxLength={17}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.sheetMeter}>
              <View
                style={[
                  styles.sheetMeterFill,
                  { width: `${(manualVinInput.length / 17) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.sheetCounter}>{manualVinInput.length} / 17</Text>
            <View style={styles.sheetButtonRow}>
              <TouchableOpacity
                style={styles.sheetCancelButton}
                onPress={() => setManualEntryVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetSubmitButton,
                  !isValidVinFormat(manualVinInput) && styles.sheetSubmitButtonDisabled,
                ]}
                onPress={handleManualSubmit}
                disabled={!isValidVinFormat(manualVinInput)}
                activeOpacity={0.85}
              >
                <Text style={styles.sheetSubmitText}>Use VIN</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ── Dock icon button ─────────────────────────────────────────────────
// Extracted to keep the main component readable. `active` tints the
// button yellow (used for the torch on-state).
interface DockButtonProps {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}
const DockButton: React.FC<DockButtonProps> = ({
  icon,
  label,
  active,
  onPress,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    style={[styles.dockButton, active && styles.dockButtonActive]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityLabel={accessibilityLabel}
  >
    <Ionicons
      name={icon}
      size={22}
      color={active ? '#1E3A5F' : '#FFF'}
    />
    <Text style={[styles.dockButtonLabel, active && styles.dockButtonLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// Public component wraps the inner screen with the error boundary so
// native-side camera crashes never take the whole app down.
export const VinScannerScreen: React.FC<VinScannerScreenProps> = (props) => (
  <VinScannerErrorBoundary onClose={() => props.navigation.goBack()}>
    <VinScannerScreenInner {...props} />
  </VinScannerErrorBoundary>
);

// ── Styles ────────────────────────────────────────────────────────────
const TICK_SIZE = 22;
const TICK_STROKE = 2.5;
const TICK_BOX_WIDTH = 280;
const TICK_BOX_HEIGHT = 110;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  // The overlay is a plain column: header → viewfinder → dock. space-between
  // plus flex:1 on centerArea guarantees the dock owns the bottom and the
  // ticks+pill stay comfortably in the middle without ever overlapping it.
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column', justifyContent: 'space-between' },

  // ── Soft vignette layers (legibility without a hard mask) ──────────
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // ── Top header (glass) ─────────────────────────────────────────────
  // Title is centered; close button is pinned to the right. A 34pt invisible
  // spacer on the left keeps the title optically centered without needing
  // the old brand dot (which clashed with the iOS recording indicator).
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    backgroundColor: 'rgba(20, 24, 32, 0.55)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  topHeaderTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
    marginLeft: 34, // same width as close button → keeps title centered
  },
  headerCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },

  // ── Center: corner ticks + status pill (natural flow) ──────────────
  // Column-flex so ticks and pill stack cleanly; paddingVertical gives the
  // pill breathing room below the ticks AND guarantees a gap from the
  // bottom dock no matter the device height. This replaces the old
  // `position:absolute; bottom:-68` pill that collided with the dock.
  centerArea: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  cornerTickWrap: {
    width: TICK_BOX_WIDTH,
    height: TICK_BOX_HEIGHT,
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    width: TICK_SIZE,
    height: TICK_SIZE,
  },
  tickTL: {
    top: 0,
    left: 0,
    borderTopWidth: TICK_STROKE,
    borderLeftWidth: TICK_STROKE,
    borderColor: colors.primary.red,
    borderTopLeftRadius: 6,
  },
  tickTR: {
    top: 0,
    right: 0,
    borderTopWidth: TICK_STROKE,
    borderRightWidth: TICK_STROKE,
    borderColor: colors.primary.red,
    borderTopRightRadius: 6,
  },
  tickBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: TICK_STROKE,
    borderLeftWidth: TICK_STROKE,
    borderColor: colors.primary.red,
    borderBottomLeftRadius: 6,
  },
  tickBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: TICK_STROKE,
    borderRightWidth: TICK_STROKE,
    borderColor: colors.primary.red,
    borderBottomRightRadius: 6,
  },

  // ── Status pill (sits in flow under the ticks) ─────────────────────
  // No `position:absolute` — the wrap participates in the centerArea column
  // so it always has a fixed gap from the dock below. `marginTop` separates
  // it visually from the ticks.
  statusPillWrap: {
    alignItems: 'center',
    marginTop: 32,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(20, 24, 32, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  statusPillBusy: {
    backgroundColor: 'rgba(37, 99, 235, 0.6)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statusPillSuccess: {
    backgroundColor: 'rgba(22, 163, 74, 0.9)',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  statusSpinner: {
    transform: [{ scale: 0.85 }],
  },
  statusPillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  helperText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // ── Tap-to-focus pulse ─────────────────────────────────────────────
  focusPulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: colors.primary.red,
    backgroundColor: 'transparent',
  },

  // ── Bottom dock (idle state) ───────────────────────────────────────
  // paddingTop creates a guaranteed gap above the dock so the helper text
  // / status pill can never tuck behind the dock pill on shorter screens.
  bottomDockWrap: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
    alignItems: 'center',
  },
  bottomDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: 28,
    backgroundColor: 'rgba(20, 24, 32, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    minWidth: 280,
  },
  dockButton: {
    width: 84,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    gap: 4,
  },
  dockButtonActive: {
    backgroundColor: '#FFD60A',
  },
  dockButtonLabel: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dockButtonLabelActive: {
    color: '#1E3A5F',
  },

  // ── Result card (after VIN accepted) ───────────────────────────────
  bottomSection: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.base,
  },
  resultCard: {
    backgroundColor: 'rgba(20, 24, 32, 0.85)',
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
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
    borderBottomColor: 'rgba(255,255,255,0.32)',
    paddingVertical: spacing.sm,
  },
  checkDigitWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  checkDigitWarning: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    marginTop: 6,
  },
  rescanButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  rescanButtonText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.status.success,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  confirmButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  // ── Manual entry bottom sheet ──────────────────────────────────────
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.navy,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  sheetInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 2,
    color: colors.text.primary,
  },
  sheetMeter: {
    height: 4,
    width: '100%',
    backgroundColor: colors.border.light,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  sheetMeterFill: {
    height: '100%',
    backgroundColor: colors.primary.navy,
    borderRadius: 2,
  },
  sheetCounter: {
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  sheetButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  sheetCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 26,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  sheetSubmitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: colors.primary.navy,
  },
  sheetSubmitButtonDisabled: { opacity: 0.45 },
  sheetSubmitText: {
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
  permissionIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
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
    borderRadius: 14,
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
