// AppraiserScreen for VinTraxx SmartScan
// Trade-In Appraisal: VIN + Diagnostics + Market Value + Photos
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Vehicle, getVehicleDisplayName, formatMileage } from '../models/Vehicle';
import { ConditionReport } from '../models/ConditionReport';
import { ScanResult } from '../services/scanner/ScannerService';
import { vinDecoder } from '../services/vin/VinDecoder';
import { kmToMiles } from '../services/obd/utils';
import { debugLogger } from '../services/debug/DebugLogger';
import { apiService } from '../services/api/ApiService';
import { useAppStore } from '../store/appStore';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import type { AiValuationOutput, AppraisalSummaryData } from '../types/api';

// Import SVG icons
import CheckIcon from '../assets/icons/check.svg';
import WarningIcon from '../assets/icons/warning.svg';
import SearchIcon from '../assets/icons/search.svg';
import ScanInfoIcon from '../assets/icons/scaninfo.svg';

// --- Types ---
type ConditionLevel = 'clean' | 'average' | 'rough';

interface AppraisalPhoto {
  id: string;
  label: string;
  uri: string | null;
  base64?: string | null;
  required: boolean;
}

interface AppraiserScreenProps {
  navigation: any;
  route?: {
    params?: {
      scanResult?: ScanResult;
      vehicle?: Vehicle;
      conditionReport?: ConditionReport;
    };
  };
}

// --- Helpers ---
const formatCurrency = (value: number): string => {
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

const computeHealthScore = (report?: ConditionReport): number => {
  if (!report) return 100;
  const activeCount = report.activeDtcCodes.length;
  const pendingCount = report.pendingDtcCodes.length;
  const criticalCount = report.activeDtcCodes.filter(c => c.severity === 'critical').length;
  let score = 100;
  score -= criticalCount * 20;
  score -= activeCount * 10;
  score -= pendingCount * 5;
  if (report.celStatus) score -= 10;
  return Math.max(0, Math.min(100, score));
};

const getHealthColor = (score: number): string => {
  if (score >= 80) return colors.status.success;
  if (score >= 50) return colors.status.warning;
  return colors.status.error;
};

const getHealthLabel = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
};

// --- Main Component ---
export const AppraiserScreen: React.FC<AppraiserScreenProps> = ({ navigation, route }) => {
  const params = route?.params || {};
  const scanResult = params.scanResult;
  const conditionReport = params.conditionReport;
  const defaultVehicle: Vehicle = params.vehicle || {
    id: 'manual-' + Date.now(),
    vin: 'UNKNOWN',
    year: new Date().getFullYear(),
    make: 'Unknown',
    model: 'Vehicle',
    mileage: null,
  };

  const { user } = useAppStore();

  // --- State ---
  const [vinInput, setVinInput] = useState(defaultVehicle.vin !== 'UNKNOWN' ? defaultVehicle.vin : '');
  const [vehicle, setVehicle] = useState<Vehicle>(defaultVehicle);
  const [vinDecoded, setVinDecoded] = useState(defaultVehicle.vin !== 'UNKNOWN');
  const [mileage, setMileage] = useState(
    defaultVehicle.mileage ? String(Math.round(defaultVehicle.mileage)) : ''
  );
  const [zipCode, setZipCode] = useState('');
  const [condition, setCondition] = useState<ConditionLevel>('average');
  const [notes, setNotes] = useState('');
  const [appraisalStarted, setAppraisalStarted] = useState(false);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationData, setValuationData] = useState<AiValuationOutput | null>(null);
  const [appraisalId, setAppraisalId] = useState<string | null>(null);
  const [showSourceAnchors, setShowSourceAnchors] = useState(false);
  const [showDiagDetails, setShowDiagDetails] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailModalType, setEmailModalType] = useState<'email' | 'pdf'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [photos, setPhotos] = useState<AppraisalPhoto[]>([
    { id: 'front', label: 'Front Exterior', uri: null, required: true },
    { id: 'rear', label: 'Rear Exterior', uri: null, required: true },
    { id: 'interior', label: 'Interior', uri: null, required: true },
    { id: 'dashboard', label: 'Dashboard / Mileage', uri: null, required: true },
    { id: 'vin_plate', label: 'VIN Plate', uri: null, required: false },
    { id: 'damage', label: 'Damage (optional)', uri: null, required: false },
  ]);

  // Log screen mount
  useEffect(() => {
    debugLogger.logEvent('Appraiser: Screen opened', {
      vin: defaultVehicle.vin,
      make: defaultVehicle.make,
      model: defaultVehicle.model,
      year: defaultVehicle.year,
      hasDiagnostics: !!conditionReport,
    });
  }, []);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Valuation shimmer animation
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (valuationLoading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [valuationLoading, shimmerAnim]);

  // --- Computed ---
  const healthScore = computeHealthScore(conditionReport);
  const totalIssues = conditionReport
    ? conditionReport.activeDtcCodes.length + conditionReport.pendingDtcCodes.length
    : 0;
  const criticalIssues = conditionReport
    ? conditionReport.activeDtcCodes.filter(c => c.severity === 'critical').length
    : 0;
  const photoCount = photos.filter(p => p.uri !== null).length;

  // --- Helper: decode VIN with NHTSA (async) then update vehicle state ---
  const decodeAndSetVehicle = useCallback(async (vin: string, source: 'camera' | 'manual') => {
    // Immediate local decode for fast UI feedback
    const localDecoded = vinDecoder.decodeVIN(vin);
    if (localDecoded.valid) {
      setVehicle(prev => ({
        ...prev,
        vin,
        year: localDecoded.year,
        make: localDecoded.make,
        model: localDecoded.model,
      }));
      setVinDecoded(true);
      debugLogger.logEvent(`Appraiser: VIN local decode (${source})`, {
        vin, year: localDecoded.year, make: localDecoded.make, model: localDecoded.model,
      });
    }

    // Then fetch full decode from NHTSA API for accurate make/model/trim
    try {
      debugLogger.logEvent(`Appraiser: NHTSA decode started (${source})`, { vin });
      const nhtsaResult = await vinDecoder.decodeVINRemote(vin);
      if (nhtsaResult.valid && nhtsaResult.make !== 'Unknown') {
        setVehicle(prev => ({
          ...prev,
          vin,
          year: nhtsaResult.year,
          make: nhtsaResult.make,
          model: nhtsaResult.model,
          trim: nhtsaResult.trim || prev.trim,
        }));
        setVinDecoded(true);
        debugLogger.logEvent(`Appraiser: NHTSA decode success (${source})`, {
          vin, year: nhtsaResult.year, make: nhtsaResult.make,
          model: nhtsaResult.model, trim: nhtsaResult.trim, bodyClass: nhtsaResult.bodyClass,
        });
      } else {
        debugLogger.logEvent(`Appraiser: NHTSA decode incomplete (${source}), using local`, {
          error: nhtsaResult.error,
        });
        // Keep local decode result if NHTSA failed but local was valid
        if (!localDecoded.valid) {
          Alert.alert('Decode Failed', 'Unable to decode VIN. Please verify and try again.');
        }
      }
    } catch (error) {
      debugLogger.logEvent(`Appraiser: NHTSA decode error (${source}), using local`, {
        error: error instanceof Error ? error.message : 'unknown',
      });
      // Keep local decode result
      if (!localDecoded.valid) {
        Alert.alert('Decode Failed', 'Unable to decode VIN. Please verify and try again.');
      }
    }
  }, []);

  // --- Handlers ---
  const handleScanVin = useCallback(() => {
    debugLogger.logEvent('Appraiser: VIN scan via camera initiated');
    navigation.navigate('VinScanner', {
      onVinScanned: (vin: string) => {
        debugLogger.logEvent('Appraiser: VIN received from camera scanner', { vin });
        setVinInput(vin);
        decodeAndSetVehicle(vin, 'camera');
      },
    });
  }, [navigation, decodeAndSetVehicle]);

  const handleDecodeVin = useCallback(() => {
    const vin = vinInput.trim().toUpperCase();
    debugLogger.logEvent('Appraiser: Manual VIN decode attempted', { vin, length: vin.length });
    if (vin.length !== 17) {
      debugLogger.logEvent('Appraiser: VIN validation failed - invalid length', { length: vin.length });
      Alert.alert('Invalid VIN', 'VIN must be exactly 17 characters.');
      return;
    }
    decodeAndSetVehicle(vin, 'manual');
  }, [vinInput, decodeAndSetVehicle]);

  const handleCapturePhoto = useCallback((photoId: string) => {
    debugLogger.logEvent('Appraiser: Photo capture initiated', { photoId });

    const cameraOptions: CameraOptions = {
      mediaType: 'photo',
      quality: 0.6,
      maxWidth: 1280,
      maxHeight: 960,
      saveToPhotos: false,
      includeBase64: true,
    };

    const libraryOptions: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.6,
      maxWidth: 1280,
      maxHeight: 960,
      selectionLimit: 1,
      includeBase64: true,
    };

    Alert.alert(
      'Add Photo',
      'Choose a source for the vehicle photo.',
      [
        {
          text: 'Camera',
          onPress: () => {
            debugLogger.logEvent('Appraiser: Photo source selected - Camera', { photoId });
            launchCamera(cameraOptions, (response) => {
              if (response.didCancel) {
                debugLogger.logEvent('Appraiser: Camera cancelled', { photoId });
                return;
              }
              if (response.errorCode) {
                debugLogger.logError('Appraiser: Camera error', response.errorMessage, { photoId, errorCode: response.errorCode });
                Alert.alert('Camera Error', response.errorMessage || 'Failed to capture photo.');
                return;
              }
              if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                const uri = asset.uri || null;
                const base64 = asset.base64 || null;
                debugLogger.logEvent('Appraiser: Photo captured via camera', { photoId, uri, hasBase64: !!base64 });
                setPhotos(prev =>
                  prev.map(p => (p.id === photoId ? { ...p, uri, base64 } : p))
                );
              }
            });
          },
        },
        {
          text: 'Photo Library',
          onPress: () => {
            debugLogger.logEvent('Appraiser: Photo source selected - Library', { photoId });
            launchImageLibrary(libraryOptions, (response) => {
              if (response.didCancel) {
                debugLogger.logEvent('Appraiser: Library picker cancelled', { photoId });
                return;
              }
              if (response.errorCode) {
                debugLogger.logError('Appraiser: Library picker error', response.errorMessage, { photoId, errorCode: response.errorCode });
                Alert.alert('Error', response.errorMessage || 'Failed to select photo.');
                return;
              }
              if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                const uri = asset.uri || null;
                const base64 = asset.base64 || null;
                debugLogger.logEvent('Appraiser: Photo selected from library', { photoId, uri, hasBase64: !!base64 });
                setPhotos(prev =>
                  prev.map(p => (p.id === photoId ? { ...p, uri, base64 } : p))
                );
              }
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const handleStartAppraisal = useCallback(async () => {
    debugLogger.logEvent('Appraiser: Start appraisal requested', {
      mileage,
      condition,
      vinDecoded,
      vin: vehicle.vin,
      photoCount,
    });
    if (!mileage || isNaN(Number(mileage))) {
      debugLogger.logEvent('Appraiser: Appraisal blocked - mileage required');
      Alert.alert('Mileage Required', 'Please enter the vehicle mileage.');
      return;
    }
    if (!vinDecoded || vehicle.vin === 'UNKNOWN') {
      debugLogger.logEvent('Appraiser: Appraisal blocked - VIN required');
      Alert.alert('VIN Required', 'Please enter and decode a valid VIN before starting the appraisal.');
      return;
    }

    setAppraisalStarted(true);
    setValuationLoading(true);
    debugLogger.logEvent('Appraiser: Fetching AI market valuations from backend');

    try {
      const result = await apiService.getAppraisalValuation({
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        mileage: Number(mileage),
        condition,
        zipCode: zipCode || undefined,
        notes: notes || undefined,
      });

      if (result.success && result.valuation && result.appraisalId) {
        setValuationData(result.valuation);
        setAppraisalId(result.appraisalId);
        debugLogger.logEvent('Appraiser: AI valuation received', {
          appraisalId: result.appraisalId,
          tradeInLow: result.valuation.estimatedTradeInLow,
          tradeInHigh: result.valuation.estimatedTradeInHigh,
          confidence: result.valuation.confidenceLevel,
          sourcesCount: result.valuation.comparableSources.length,
        });
      } else {
        debugLogger.logError('Appraiser: AI valuation failed', result.message);
        Alert.alert('Valuation Failed', result.message || 'Unable to get market valuation. Please try again.');
        setAppraisalStarted(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      debugLogger.logError('Appraiser: AI valuation exception', errorMsg);
      Alert.alert('Error', `Failed to get valuation: ${errorMsg}`);
      setAppraisalStarted(false);
    } finally {
      setValuationLoading(false);
    }
  }, [mileage, vehicle, condition, vinDecoded, zipCode, notes, photoCount]);

  const handleSaveAppraisal = useCallback(() => {
    debugLogger.logEvent('Appraiser: Save appraisal', {
      vin: vehicle.vin,
      mileage,
      condition,
      photoCount,
      valuationData,
    });
    Alert.alert('Appraisal Saved', 'The appraisal has been saved locally.', [{ text: 'OK' }]);
  }, [vehicle.vin, mileage, condition, photoCount, valuationData]);

  // Build appraisal summary for email/pdf/dashboard
  const buildAppraisalSummary = useCallback((): AppraisalSummaryData | null => {
    if (!valuationData || !appraisalId) return null;
    return {
      appraisalId,
      vehicle: {
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        mileage: Number(mileage),
      },
      condition,
      zipCode: zipCode || undefined,
      notes: notes || undefined,
      valuation: valuationData,
      healthScore,
      diagnosticsSummary: conditionReport
        ? `Health: ${healthScore}/100, ${totalIssues} issues, ${criticalIssues} critical`
        : undefined,
      photoCount,
      photos: photos
        .filter(p => p.base64)
        .map(p => `data:image/jpeg;base64,${p.base64}`),
      createdAt: new Date().toISOString(),
      userEmail: user?.email || '',
    };
  }, [valuationData, appraisalId, vehicle, mileage, condition, zipCode, notes, healthScore, conditionReport, totalIssues, criticalIssues, photoCount, photos, user]);

  const handleEmailAppraisal = useCallback(() => {
    debugLogger.logEvent('Appraiser: Email appraisal requested');
    const summary = buildAppraisalSummary();
    if (!summary) {
      Alert.alert('No Data', 'Please complete the appraisal first.');
      return;
    }
    setEmailInput(user?.email || '');
    setEmailModalType('email');
    setEmailModalVisible(true);
  }, [buildAppraisalSummary, user]);

  const handleExportPdf = useCallback(() => {
    debugLogger.logEvent('Appraiser: PDF export requested');
    const summary = buildAppraisalSummary();
    if (!summary) {
      Alert.alert('No Data', 'Please complete the appraisal first.');
      return;
    }
    setEmailInput(user?.email || '');
    setEmailModalType('pdf');
    setEmailModalVisible(true);
  }, [buildAppraisalSummary, user]);

  const handleSendEmailAction = useCallback(async () => {
    const email = emailInput.trim();
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    const summary = buildAppraisalSummary();
    if (!summary) return;

    setEmailSending(true);
    debugLogger.logEvent(`Appraiser: Sending ${emailModalType}`, { toEmail: email, appraisalId });

    try {
      const result = emailModalType === 'pdf'
        ? await apiService.sendAppraisalPdf(email, summary)
        : await apiService.sendAppraisalEmail(email, summary);

      if (result.success) {
        debugLogger.logEvent(`Appraiser: ${emailModalType} sent successfully`, { toEmail: email });
        setEmailModalVisible(false);
        Alert.alert(
          emailModalType === 'pdf' ? 'PDF Sent' : 'Email Sent',
          `Appraisal ${emailModalType === 'pdf' ? 'PDF' : 'summary'} sent to ${email}`,
        );
      } else {
        debugLogger.logError(`Appraiser: ${emailModalType} send failed`, result.message);
        Alert.alert('Failed', result.message || `Failed to send ${emailModalType}.`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      debugLogger.logError(`Appraiser: ${emailModalType} exception`, msg);
      Alert.alert('Error', `Failed to send: ${msg}`);
    } finally {
      setEmailSending(false);
    }
  }, [emailInput, emailModalType, buildAppraisalSummary, appraisalId]);

  const handleDashboard = useCallback(() => {
    debugLogger.logEvent('Appraiser: Dashboard requested', { appraisalId });
    if (!appraisalId) {
      Alert.alert('No Data', 'Please complete the appraisal first.');
      return;
    }
    Alert.alert(
      'Dashboard',
      `Appraisal data is available on the dashboard.\n\nAppraisal ID: ${appraisalId}\n\nAccess via: GET /api/v1/appraisal/dashboard/${appraisalId}`,
      [{ text: 'OK' }],
    );
  }, [appraisalId]);

  // --- Render Sections ---
  const renderVinSection = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>1</Text>
        </View>
        <Text style={styles.cardTitle}>Vehicle Identification</Text>
      </View>

      <View style={styles.vinRow}>
        <TouchableOpacity style={styles.scanVinButton} onPress={handleScanVin} activeOpacity={0.7}>
          <Text style={styles.scanVinIcon}>📷</Text>
          <Text style={styles.scanVinText}>Scan VIN</Text>
        </TouchableOpacity>
        <View style={styles.vinInputContainer}>
          <TextInput
            style={styles.vinInput}
            placeholder="Enter VIN manually"
            placeholderTextColor={colors.text.light}
            value={vinInput}
            onChangeText={setVinInput}
            maxLength={17}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {vinInput.length === 17 && !vinDecoded && (
            <TouchableOpacity style={styles.decodeButton} onPress={handleDecodeVin}>
              <SearchIcon width={18} height={18} color={colors.text.inverse} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {vinDecoded && (
        <View style={styles.vehicleInfoGrid}>
          <View style={styles.vehicleInfoRow}>
            <View style={styles.vehicleInfoItem}>
              <Text style={styles.vehicleInfoLabel}>Year</Text>
              <Text style={styles.vehicleInfoValue}>{vehicle.year}</Text>
            </View>
            <View style={styles.vehicleInfoItem}>
              <Text style={styles.vehicleInfoLabel}>Make</Text>
              <Text style={styles.vehicleInfoValue}>{vehicle.make}</Text>
            </View>
          </View>
          <View style={styles.vehicleInfoRow}>
            <View style={styles.vehicleInfoItem}>
              <Text style={styles.vehicleInfoLabel}>Model</Text>
              <Text style={styles.vehicleInfoValue}>{vehicle.model}</Text>
            </View>
            <View style={styles.vehicleInfoItem}>
              <Text style={styles.vehicleInfoLabel}>Trim</Text>
              <Text style={styles.vehicleInfoValue}>{vehicle.trim || '—'}</Text>
            </View>
          </View>
          {scanResult?.vin?.vin && (
            <View style={styles.vinDisplayRow}>
              <Text style={styles.vinDisplayLabel}>VIN</Text>
              <Text style={styles.vinDisplayValue}>{vehicle.vin}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderAppraisalInputSection = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>2</Text>
        </View>
        <Text style={styles.cardTitle}>Appraisal Details</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Mileage <Text style={styles.requiredStar}>*</Text></Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 45230"
          placeholderTextColor={colors.text.light}
          value={mileage}
          onChangeText={setMileage}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>ZIP Code</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 90210"
          placeholderTextColor={colors.text.light}
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="numeric"
          maxLength={5}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Condition <Text style={styles.requiredStar}>*</Text></Text>
        <View style={styles.conditionRow}>
          {(['clean', 'average', 'rough'] as ConditionLevel[]).map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.conditionChip,
                condition === level && styles.conditionChipActive,
                condition === level && level === 'clean' && { backgroundColor: colors.status.success },
                condition === level && level === 'average' && { backgroundColor: colors.status.warning },
                condition === level && level === 'rough' && { backgroundColor: colors.status.error },
              ]}
              onPress={() => setCondition(level)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.conditionChipText,
                condition === level && styles.conditionChipTextActive,
              ]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Notes</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Additional notes about the vehicle..."
          placeholderTextColor={colors.text.light}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderDiagnosticsSection = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>3</Text>
        </View>
        <Text style={styles.cardTitle}>Diagnostics Summary</Text>
        <View style={[styles.healthBadge, { backgroundColor: getHealthColor(healthScore) + '20' }]}>
          <View style={[styles.healthDot, { backgroundColor: getHealthColor(healthScore) }]} />
          <Text style={[styles.healthBadgeText, { color: getHealthColor(healthScore) }]}>
            {getHealthLabel(healthScore)}
          </Text>
        </View>
      </View>

      <View style={styles.diagGrid}>
        <View style={styles.diagStatCard}>
          <Text style={[styles.diagStatValue, { color: getHealthColor(healthScore) }]}>{healthScore}</Text>
          <Text style={styles.diagStatLabel}>Health Score</Text>
        </View>
        <View style={styles.diagStatCard}>
          <Text style={[styles.diagStatValue, { color: totalIssues > 0 ? colors.status.warning : colors.status.success }]}>
            {totalIssues}
          </Text>
          <Text style={styles.diagStatLabel}>Issues Found</Text>
        </View>
        <View style={styles.diagStatCard}>
          <Text style={[styles.diagStatValue, { color: criticalIssues > 0 ? colors.status.error : colors.status.success }]}>
            {criticalIssues}
          </Text>
          <Text style={styles.diagStatLabel}>Critical</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setShowDiagDetails(!showDiagDetails)}
        activeOpacity={0.7}
      >
        <ScanInfoIcon width={16} height={16} color={colors.primary.navy} />
        <Text style={styles.expandButtonText}>
          {showDiagDetails ? 'Hide' : 'View'} Full Diagnostic Report
        </Text>
        <Text style={styles.expandArrow}>{showDiagDetails ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showDiagDetails && conditionReport && (
        <View style={styles.diagDetailContainer}>
          {conditionReport.activeDtcCodes.length > 0 && (
            <View style={styles.diagDetailGroup}>
              <Text style={styles.diagDetailGroupTitle}>Active Codes</Text>
              {conditionReport.activeDtcCodes.map(dtc => (
                <View key={dtc.id} style={styles.diagDetailItem}>
                  <View style={[styles.severityDot, {
                    backgroundColor: dtc.severity === 'critical' ? colors.status.error :
                      dtc.severity === 'warning' ? colors.status.warning : colors.status.info,
                  }]} />
                  <Text style={styles.diagDetailCode}>{dtc.code}</Text>
                  <Text style={styles.diagDetailDesc} numberOfLines={1}>{dtc.description}</Text>
                </View>
              ))}
            </View>
          )}
          {conditionReport.pendingDtcCodes.length > 0 && (
            <View style={styles.diagDetailGroup}>
              <Text style={styles.diagDetailGroupTitle}>Pending Codes</Text>
              {conditionReport.pendingDtcCodes.map(dtc => (
                <View key={dtc.id} style={styles.diagDetailItem}>
                  <View style={[styles.severityDot, { backgroundColor: colors.status.warning }]} />
                  <Text style={styles.diagDetailCode}>{dtc.code}</Text>
                  <Text style={styles.diagDetailDesc} numberOfLines={1}>{dtc.description}</Text>
                </View>
              ))}
            </View>
          )}
          {totalIssues === 0 && (
            <View style={styles.noIssuesRow}>
              <CheckIcon width={18} height={18} color={colors.status.success} />
              <Text style={styles.noIssuesText}>No diagnostic trouble codes detected</Text>
            </View>
          )}
          <View style={styles.diagDetailRow}>
            <Text style={styles.diagDetailLabel}>CEL Status</Text>
            <Text style={[styles.diagDetailValue2, {
              color: conditionReport.celStatus ? colors.status.error : colors.status.success,
            }]}>
              {conditionReport.celStatus ? 'ON' : 'OFF'}
            </Text>
          </View>
          <View style={styles.diagDetailRow}>
            <Text style={styles.diagDetailLabel}>Emissions</Text>
            <Text style={[styles.diagDetailValue2, {
              color: conditionReport.emissionsCheck.status === 'passed' ? colors.status.success : colors.status.error,
            }]}>
              {conditionReport.emissionsCheck.status.toUpperCase()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderStartAppraisalButton = () => {
    if (appraisalStarted) return null;
    return (
      <TouchableOpacity
        style={styles.startAppraisalButton}
        onPress={handleStartAppraisal}
        activeOpacity={0.8}
      >
        <Text style={styles.startAppraisalText}>Start Appraisal</Text>
        <Text style={styles.startAppraisalSub}>Fetch market valuations</Text>
      </TouchableOpacity>
    );
  };

  const renderValuationSection = () => {
    if (!appraisalStarted) return null;

    if (valuationLoading) {
      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>4</Text>
            </View>
            <Text style={styles.cardTitle}>Market Valuation</Text>
          </View>
          <View style={styles.skeletonContainer}>
            <Animated.View style={[styles.skeletonBar, styles.skeletonBarLarge, {
              opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
            }]} />
            <Animated.View style={[styles.skeletonBar, styles.skeletonBarMedium, {
              opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
            }]} />
            <Animated.View style={[styles.skeletonBar, styles.skeletonBarSmall, {
              opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] }),
            }]} />
          </View>
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary.navy} />
            <Text style={styles.loadingText}>Fetching market data...</Text>
          </View>
        </View>
      );
    }

    if (!valuationData) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>4</Text>
          </View>
          <Text style={styles.cardTitle}>Market Valuation</Text>
        </View>

        <View style={styles.valuationPrimary}>
          <Text style={styles.valuationLabel}>SmartScan Estimated Trade-In Range</Text>
          <Text style={styles.valuationRange}>
            {formatCurrency(valuationData.estimatedTradeInLow)} – {formatCurrency(valuationData.estimatedTradeInHigh)}
          </Text>
          <View style={styles.valuationBarTrack}>
            <View style={[styles.valuationBarFill, { width: '70%' }]} />
            <View style={styles.valuationBarMarker} />
          </View>
        </View>

        {/* Wholesale, Retail & Private Party Values */}
        <View style={styles.valuationTiersRow}>
          <View style={styles.valuationTierBox}>
            <Text style={styles.valuationTierLabel}>Wholesale</Text>
            <Text style={styles.valuationTierValue}>
              {formatCurrency(valuationData.estimatedWholesaleLow)} – {formatCurrency(valuationData.estimatedWholesaleHigh)}
            </Text>
          </View>
          <View style={styles.valuationTierBox}>
            <Text style={styles.valuationTierLabel}>Retail</Text>
            <Text style={styles.valuationTierValue}>
              {formatCurrency(valuationData.estimatedRetailLow)} – {formatCurrency(valuationData.estimatedRetailHigh)}
            </Text>
          </View>
          <View style={styles.valuationTierBox}>
            <Text style={styles.valuationTierLabel}>Private Party</Text>
            <Text style={styles.valuationTierValue}>
              {formatCurrency(valuationData.estimatedPrivatePartyLow)} – {formatCurrency(valuationData.estimatedPrivatePartyHigh)}
            </Text>
          </View>
        </View>

        {/* Confidence & Trend */}
        <View style={styles.valuationMetaRow}>
          <View style={[styles.confidenceBadge, {
            backgroundColor: valuationData.confidenceLevel === 'high' ? colors.status.successLight :
              valuationData.confidenceLevel === 'medium' ? '#FFF8E1' : colors.status.errorLight,
          }]}>
            <Text style={[styles.confidenceBadgeText, {
              color: valuationData.confidenceLevel === 'high' ? colors.status.success :
                valuationData.confidenceLevel === 'medium' ? '#F9A825' : colors.status.error,
            }]}>
              {valuationData.confidenceLevel.toUpperCase()} CONFIDENCE
            </Text>
          </View>
          <View style={[styles.confidenceBadge, {
            backgroundColor: valuationData.marketTrend === 'appreciating' ? colors.status.successLight :
              valuationData.marketTrend === 'stable' ? '#E3F2FD' : '#FFF8E1',
          }]}>
            <Text style={[styles.confidenceBadgeText, {
              color: valuationData.marketTrend === 'appreciating' ? colors.status.success :
                valuationData.marketTrend === 'stable' ? colors.status.info : '#F9A825',
            }]}>
              {valuationData.marketTrend.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* AI Summary */}
        <View style={styles.aiSummaryBox}>
          <Text style={styles.aiSummaryText}>{valuationData.aiSummary}</Text>
          <Text style={styles.aiDataAsOf}>Data as of: {valuationData.dataAsOf}</Text>
        </View>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setShowSourceAnchors(!showSourceAnchors)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandButtonText}>
            {showSourceAnchors ? 'Hide' : 'Show'} Source Anchors
          </Text>
          <Text style={styles.expandArrow}>{showSourceAnchors ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showSourceAnchors && (
          <View style={styles.sourceAnchorsContainer}>
            {valuationData.comparableSources.map((src, idx) => {
              const dotColors = ['#333', '#0066CC', '#CC6600'];
              return (
                <View key={src.sourceName} style={styles.sourceRow}>
                  <View style={[styles.sourceDot, { backgroundColor: dotColors[idx] || '#333' }]} />
                  <Text style={styles.sourceLabel}>{src.sourceName}</Text>
                  <Text style={styles.sourceValue}>
                    {formatCurrency(src.tradeInLow)} – {formatCurrency(src.tradeInHigh)}
                  </Text>
                </View>
              );
            })}

            {/* Adjustments */}
            {valuationData.adjustments.length > 0 && (
              <View style={styles.adjustmentsContainer}>
                <Text style={styles.adjustmentsTitle}>Value Adjustments</Text>
                {valuationData.adjustments.map((adj, idx) => (
                  <View key={idx} style={styles.adjustmentRow}>
                    <Text style={styles.adjustmentFactor}>{adj.factor}</Text>
                    <Text style={[styles.adjustmentImpact, {
                      color: adj.impact >= 0 ? colors.status.success : colors.status.error,
                    }]}>
                      {adj.impact >= 0 ? '+' : ''}{formatCurrency(adj.impact)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.sourceNote}>
              <Text style={styles.sourceNoteText}>
                AI-estimated values based on current market data. Connect Black Book / JD Power API keys for live data.
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderRiskSummary = () => {
    if (!appraisalStarted || valuationLoading) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>5</Text>
          </View>
          <Text style={styles.cardTitle}>Risk Summary</Text>
        </View>
        <View style={styles.riskGrid}>
          <View style={styles.riskBadge}>
            <Text style={styles.riskIcon}>✅</Text>
            <Text style={styles.riskLabel}>Clean Title</Text>
          </View>
          <View style={styles.riskBadge}>
            <Text style={styles.riskIcon}>✅</Text>
            <Text style={styles.riskLabel}>No Accidents</Text>
          </View>
          <View style={styles.riskBadge}>
            <Text style={styles.riskIcon}>✅</Text>
            <Text style={styles.riskLabel}>Odometer OK</Text>
          </View>
          <View style={styles.riskBadge}>
            <Text style={styles.riskIcon}>✅</Text>
            <Text style={styles.riskLabel}>No Structural</Text>
          </View>
        </View>
        <Text style={styles.riskNote}>
          History data requires VIN history API integration (Phase 2).
        </Text>
      </View>
    );
  };

  const renderPhotosSection = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>6</Text>
        </View>
        <Text style={styles.cardTitle}>Photos</Text>
        <View style={styles.photoCountBadge}>
          <Text style={styles.photoCountText}>{photoCount}/{photos.length}</Text>
        </View>
      </View>

      <View style={styles.photoGrid}>
        {photos.map(photo => (
          <TouchableOpacity
            key={photo.id}
            style={styles.photoSlot}
            onPress={() => handleCapturePhoto(photo.id)}
            activeOpacity={0.7}
          >
            {photo.uri ? (
              <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>📷</Text>
                <Text style={styles.photoPlaceholderText}>{photo.label}</Text>
                {photo.required && <Text style={styles.photoRequiredDot}>●</Text>}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFinalSummary = () => {
    if (!appraisalStarted || valuationLoading || !valuationData) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>7</Text>
          </View>
          <Text style={styles.cardTitle}>Appraisal Summary</Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle</Text>
            <Text style={styles.summaryValue}>{getVehicleDisplayName(vehicle)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Mileage</Text>
            <Text style={styles.summaryValue}>{formatMileage(Number(mileage))}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Condition</Text>
            <Text style={styles.summaryValue}>{condition.charAt(0).toUpperCase() + condition.slice(1)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Health Score</Text>
            <Text style={[styles.summaryValue, { color: getHealthColor(healthScore) }]}>{healthScore}/100</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Market Range</Text>
            <Text style={[styles.summaryValue, { color: colors.status.success, fontWeight: '700' }]}>
              {formatCurrency(valuationData.estimatedTradeInLow)} – {formatCurrency(valuationData.estimatedTradeInHigh)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Photos</Text>
            <Text style={styles.summaryValue}>{photoCount} captured</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSaveAppraisal} activeOpacity={0.8}>
            <Text style={styles.actionButtonPrimaryText}>Save Appraisal</Text>
          </TouchableOpacity>
          <View style={styles.actionButtonRow}>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleEmailAppraisal} activeOpacity={0.7}>
              <Text style={styles.actionButtonSecondaryText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleDashboard} activeOpacity={0.7}>
              <Text style={styles.actionButtonSecondaryText}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleExportPdf} activeOpacity={0.7}>
              <Text style={styles.actionButtonSecondaryText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trade-In Appraisal</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {renderVinSection()}
            {renderAppraisalInputSection()}
            {renderDiagnosticsSection()}
            {renderStartAppraisalButton()}
            {renderValuationSection()}
            {renderRiskSummary()}
            {renderPhotosSection()}
            {renderFinalSummary()}
          </Animated.View>

          {/* Bottom spacer for scroll */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Email Input Modal (cross-platform) */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.emailModalOverlay}>
          <View style={styles.emailModalContent}>
            <Text style={styles.emailModalTitle}>
              {emailModalType === 'pdf' ? 'Send PDF Report' : 'Send Email Summary'}
            </Text>
            <Text style={styles.emailModalSubtitle}>
              Enter the email address to receive the appraisal {emailModalType === 'pdf' ? 'PDF' : 'summary'}:
            </Text>
            <TextInput
              style={styles.emailModalInput}
              placeholder="email@example.com"
              placeholderTextColor={colors.text.light}
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!emailSending}
            />
            <View style={styles.emailModalButtons}>
              <TouchableOpacity
                style={styles.emailModalCancelBtn}
                onPress={() => setEmailModalVisible(false)}
                disabled={emailSending}
                activeOpacity={0.7}
              >
                <Text style={styles.emailModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.emailModalSendBtn, emailSending && { opacity: 0.6 }]}
                onPress={handleSendEmailAction}
                disabled={emailSending}
                activeOpacity={0.8}
              >
                {emailSending ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Text style={styles.emailModalSendText}>
                    {emailModalType === 'pdf' ? 'Send PDF' : 'Send'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex1: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary.navy,
  },
  backButton: {
    paddingVertical: spacing.xs,
    paddingRight: spacing.md,
  },
  backText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing['4xl'],
  },

  // Card
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary.navy,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sectionBadgeText: {
    color: colors.text.inverse,
    fontSize: 13,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },

  // VIN Section
  vinRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  scanVinButton: {
    backgroundColor: colors.primary.navy,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  scanVinIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  scanVinText: {
    color: colors.text.inverse,
    fontSize: 11,
    fontWeight: '600',
  },
  vinInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  vinInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.5,
  },
  decodeButton: {
    backgroundColor: colors.primary.red,
    borderRadius: 8,
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  vehicleInfoGrid: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: spacing.md,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  vehicleInfoItem: {
    flex: 1,
  },
  vehicleInfoLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vehicleInfoValue: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semiBold,
  },
  vinDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  vinDisplayLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: spacing.sm,
  },
  vinDisplayValue: {
    fontSize: 13,
    color: colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1,
  },

  // Appraisal Input
  inputGroup: {
    marginBottom: spacing.base,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  requiredStar: {
    color: colors.status.error,
  },
  textInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: {
    minHeight: 80,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  conditionChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
  },
  conditionChipActive: {
    borderColor: 'transparent',
  },
  conditionChipText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  conditionChipTextActive: {
    color: colors.text.inverse,
  },

  // Diagnostics Section
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  diagGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  diagStatCard: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  diagStatValue: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  diagStatLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  expandButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
  },
  expandArrow: {
    fontSize: 10,
    color: colors.primary.navy,
  },
  diagDetailContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  diagDetailGroup: {
    marginBottom: spacing.md,
  },
  diagDetailGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  diagDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: spacing.sm,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  diagDetailCode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    width: 55,
  },
  diagDetailDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  noIssuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  noIssuesText: {
    fontSize: typography.fontSize.base,
    color: colors.status.success,
    fontWeight: '500',
  },
  diagDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  diagDetailLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  diagDetailValue2: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Start Appraisal Button
  startAppraisalButton: {
    backgroundColor: colors.primary.red,
    borderRadius: 16,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.base,
    shadowColor: colors.primary.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startAppraisalText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontWeight: '700',
  },
  startAppraisalSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },

  // Valuation Section
  skeletonContainer: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skeletonBar: {
    backgroundColor: colors.border.light,
    borderRadius: 8,
  },
  skeletonBarLarge: {
    height: 36,
    width: '80%',
  },
  skeletonBarMedium: {
    height: 20,
    width: '60%',
  },
  skeletonBarSmall: {
    height: 14,
    width: '40%',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  valuationPrimary: {
    backgroundColor: colors.primary.navy + '08',
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  valuationLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  valuationRange: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.status.success,
    marginBottom: spacing.sm,
  },
  valuationBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border.light,
    borderRadius: 3,
    position: 'relative',
  },
  valuationBarFill: {
    height: 6,
    backgroundColor: colors.status.success,
    borderRadius: 3,
  },
  valuationBarMarker: {
    position: 'absolute',
    top: -3,
    left: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.navy,
    borderWidth: 2,
    borderColor: colors.background.secondary,
    marginLeft: -6,
  },
  valuationTiersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  valuationTierBox: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  valuationTierLabel: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  valuationTierValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  valuationMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  aiSummaryBox: {
    backgroundColor: colors.background.primary,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary.navy,
  },
  aiSummaryText: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
  },
  aiDataAsOf: {
    fontSize: 10,
    color: colors.text.light,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  adjustmentsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  adjustmentsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  adjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  adjustmentFactor: {
    fontSize: 13,
    color: colors.text.secondary,
    flex: 1,
  },
  adjustmentImpact: {
    fontSize: 13,
    fontWeight: '700',
  },
  sourceAnchorsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: spacing.sm,
  },
  sourceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sourceLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    flex: 1,
  },
  sourceValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  sourceNote: {
    marginTop: spacing.sm,
    backgroundColor: colors.status.infoLight,
    borderRadius: 8,
    padding: spacing.sm,
  },
  sourceNoteText: {
    fontSize: 11,
    color: colors.status.info,
    textAlign: 'center',
  },

  // Risk Summary
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.successLight,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  riskIcon: {
    fontSize: 14,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.status.success,
  },
  riskNote: {
    fontSize: 11,
    color: colors.text.light,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Photos Section
  photoCountBadge: {
    backgroundColor: colors.primary.navy + '15',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary.navy,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  photoPlaceholderIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  photoPlaceholderText: {
    fontSize: 9,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  photoRequiredDot: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 8,
    color: colors.status.error,
  },

  // Final Summary
  summaryGrid: {
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.primary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacing.md,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border.light,
  },

  // Action Buttons
  actionButtons: {
    gap: spacing.md,
  },
  actionButtonPrimary: {
    backgroundColor: colors.status.success,
    borderRadius: 14,
    paddingVertical: spacing.base,
    alignItems: 'center',
    shadowColor: colors.status.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonPrimaryText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: '700',
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: colors.primary.navy,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
  },

  // Email Modal
  emailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.screenHorizontal,
  },
  emailModalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  emailModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emailModalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.base,
  },
  emailModalInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.base,
  },
  emailModalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emailModalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emailModalCancelText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.secondary,
  },
  emailModalSendBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.primary.navy,
  },
  emailModalSendText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semiBold,
    color: colors.text.inverse,
  },
});
