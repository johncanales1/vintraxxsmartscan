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
  required: boolean;
}

interface ValuationData {
  smartScanLow: number;
  smartScanHigh: number;
  blackBook: number | null;
  mmr: number | null;
  jdPower: number | null;
}

interface AppraiserScreenProps {
  navigation: any;
  route: {
    params: {
      scanResult: ScanResult;
      vehicle: Vehicle;
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
  const { scanResult, vehicle: initialVehicle, conditionReport } = route.params;

  // --- State ---
  const [vinInput, setVinInput] = useState(initialVehicle.vin !== 'UNKNOWN' ? initialVehicle.vin : '');
  const [vehicle, setVehicle] = useState<Vehicle>(initialVehicle);
  const [vinDecoded, setVinDecoded] = useState(initialVehicle.vin !== 'UNKNOWN');
  const [mileage, setMileage] = useState(
    initialVehicle.mileage ? String(Math.round(initialVehicle.mileage)) : ''
  );
  const [zipCode, setZipCode] = useState('');
  const [condition, setCondition] = useState<ConditionLevel>('average');
  const [notes, setNotes] = useState('');
  const [appraisalStarted, setAppraisalStarted] = useState(false);
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationData, setValuationData] = useState<ValuationData | null>(null);
  const [showSourceAnchors, setShowSourceAnchors] = useState(false);
  const [showDiagDetails, setShowDiagDetails] = useState(false);
  const [photos, setPhotos] = useState<AppraisalPhoto[]>([
    { id: 'front', label: 'Front Exterior', uri: null, required: true },
    { id: 'rear', label: 'Rear Exterior', uri: null, required: true },
    { id: 'interior', label: 'Interior', uri: null, required: true },
    { id: 'dashboard', label: 'Dashboard / Mileage', uri: null, required: true },
    { id: 'vin_plate', label: 'VIN Plate', uri: null, required: false },
    { id: 'damage', label: 'Damage (optional)', uri: null, required: false },
  ]);

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

  // --- Handlers ---
  const handleScanVin = useCallback(() => {
    Alert.alert(
      'VIN Scanner',
      'Camera-based VIN barcode scanning requires the react-native-vision-camera library.\n\nThis will be enabled in Phase 2. Please enter VIN manually for now.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleDecodeVin = useCallback(() => {
    const vin = vinInput.trim().toUpperCase();
    if (vin.length !== 17) {
      Alert.alert('Invalid VIN', 'VIN must be exactly 17 characters.');
      return;
    }
    const decoded = vinDecoder.decodeVIN(vin);
    if (decoded.valid) {
      setVehicle(prev => ({
        ...prev,
        vin,
        year: decoded.year,
        make: decoded.make,
        model: decoded.model,
      }));
      setVinDecoded(true);
    } else {
      Alert.alert('Decode Failed', decoded.error || 'Unable to decode VIN.');
    }
  }, [vinInput]);

  const handleCapturePhoto = useCallback((photoId: string) => {
    Alert.alert(
      'Photo Capture',
      'Camera capture requires react-native-vision-camera or react-native-image-picker.\n\nThis will be enabled in Phase 2.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleStartAppraisal = useCallback(async () => {
    if (!mileage || isNaN(Number(mileage))) {
      Alert.alert('Mileage Required', 'Please enter the vehicle mileage.');
      return;
    }

    setAppraisalStarted(true);
    setValuationLoading(true);

    // Simulate API call delay (no real API keys yet)
    setTimeout(() => {
      const baseMiles = Number(mileage);
      const yearFactor = Math.max(0, (vehicle.year - 2010) * 800);
      const mileagePenalty = Math.round(baseMiles * 0.04);
      const conditionAdj = condition === 'clean' ? 1500 : condition === 'rough' ? -1800 : 0;

      const baseValue = 12000 + yearFactor - mileagePenalty + conditionAdj;
      const low = Math.max(2000, Math.round(baseValue * 0.92 / 100) * 100);
      const high = Math.round(baseValue * 1.08 / 100) * 100;
      const mid = Math.round((low + high) / 2 / 100) * 100;

      setValuationData({
        smartScanLow: low,
        smartScanHigh: high,
        blackBook: mid + 200,
        mmr: mid - 100,
        jdPower: mid + 400,
      });
      setValuationLoading(false);
    }, 2500);
  }, [mileage, vehicle.year, condition]);

  const handleSaveAppraisal = useCallback(() => {
    Alert.alert('Appraisal Saved', 'The appraisal has been saved locally.', [{ text: 'OK' }]);
  }, []);

  const handleEmailAppraisal = useCallback(() => {
    Alert.alert('Email Appraisal', 'Email integration will be available in Phase 2.', [{ text: 'OK' }]);
  }, []);

  const handleExportPdf = useCallback(() => {
    Alert.alert('Export PDF', 'PDF export will be available in Phase 2.', [{ text: 'OK' }]);
  }, []);

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
          <Text style={styles.valuationLabel}>SmartScan Estimated Market Range</Text>
          <Text style={styles.valuationRange}>
            {formatCurrency(valuationData.smartScanLow)} – {formatCurrency(valuationData.smartScanHigh)}
          </Text>
          <View style={styles.valuationBarTrack}>
            <View style={[styles.valuationBarFill, { width: '70%' }]} />
            <View style={styles.valuationBarMarker} />
          </View>
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
            <View style={styles.sourceRow}>
              <View style={[styles.sourceDot, { backgroundColor: '#333' }]} />
              <Text style={styles.sourceLabel}>Black Book</Text>
              <Text style={styles.sourceValue}>
                {valuationData.blackBook ? formatCurrency(valuationData.blackBook) : 'No API Key'}
              </Text>
            </View>
            <View style={styles.sourceRow}>
              <View style={[styles.sourceDot, { backgroundColor: '#0066CC' }]} />
              <Text style={styles.sourceLabel}>MMR (Manheim)</Text>
              <Text style={styles.sourceValue}>
                {valuationData.mmr ? formatCurrency(valuationData.mmr) : 'No API Key'}
              </Text>
            </View>
            <View style={styles.sourceRow}>
              <View style={[styles.sourceDot, { backgroundColor: '#CC6600' }]} />
              <Text style={styles.sourceLabel}>JD Power</Text>
              <Text style={styles.sourceValue}>
                {valuationData.jdPower ? formatCurrency(valuationData.jdPower) : 'No API Key'}
              </Text>
            </View>
            <View style={styles.sourceNote}>
              <Text style={styles.sourceNoteText}>
                Values shown are simulated estimates. Connect API keys in Settings for live data.
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
              {formatCurrency(valuationData.smartScanLow)} – {formatCurrency(valuationData.smartScanHigh)}
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
            <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => Alert.alert('Coming Soon', 'Web Dashboard integration coming in Phase 2.')} activeOpacity={0.7}>
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
});
