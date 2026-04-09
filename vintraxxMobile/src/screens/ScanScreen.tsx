// ScanScreen for VinTraxx SmartScan
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  Easing,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Button } from '../components/Button';
import { VehicleCard } from '../components/VehicleCard';
import { CodeList } from '../components/CodeTable';
import { ReportSection } from '../components/ReportSection';
import { Vehicle } from '../models/Vehicle';
import { DtcCode } from '../models/DtcCode';
import { ConditionReport } from '../models/ConditionReport';
import { useAppStore } from '../store/appStore';
import { scannerService } from '../services/scanner/ScannerService';
import { apiService } from '../services/api/ApiService';
import { authService } from '../services/auth/AuthService';
import { logger, LogCategory } from '../utils/Logger';
import { ScanResult } from '../services/scanner/ScannerService';
import { BleConnectionState } from '../services/ble/types';
import { DebugDataScreen } from './DebugDataScreen';
import { vinDecoder } from '../services/vin/VinDecoder';
import { dtcSeverityClassifier } from '../services/obd/DtcSeverityClassifier';
import { kmToMiles, getFuelSystemStatusLabel, getSecondaryAirStatusLabel } from '../services/obd/utils';

// Import SVG icons
import CheckIcon from '../assets/icons/check.svg';
import ToolIcon from '../assets/icons/tool.svg';
import TipIcon from '../assets/icons/tip.svg';
import ConnectingIcon from '../assets/icons/connecting.svg';
import ReadingVinIcon from '../assets/icons/readingvin.svg';
import ReadingCodeIcon from '../assets/icons/readingcode.svg';
import BuildingReportIcon from '../assets/icons/buildingreport.svg';

type ScanStatus = 'idle' | 'scanning' | 'complete';

interface ScanStep {
  id: string;
  label: string;
  completeLabel: string;
  status: 'pending' | 'scanning' | 'complete';
  progress: number; // 0-100 for this step
}

interface ScanScreenProps {
  navigation: any;
  route?: {
    params?: {
      vehicle?: Vehicle;
      autoStart?: boolean;
    };
  };
}

// Helper to convert DTC type code to category
const dtcTypeToCategory = (type: 'P' | 'C' | 'B' | 'U'): 'powertrain' | 'chassis' | 'body' | 'network' => {
  switch (type) {
    case 'P': return 'powertrain';
    case 'C': return 'chassis';
    case 'B': return 'body';
    case 'U': return 'network';
    default: return 'powertrain';
  }
};

// Helper to build ConditionReport from real scan data
const buildReportFromScanResult = (scanResult: ScanResult, vehicle: Vehicle): ConditionReport => {
  // Convert parsed DTCs to DtcCode model with proper severity classification
  const activeDtcCodes: DtcCode[] = scanResult.storedDtcs.map((dtc, index) => ({
    id: `dtc-stored-${index}`,
    code: dtc.code,
    description: dtc.description || 'Unknown trouble code',
    status: 'active' as const,
    severity: dtcSeverityClassifier.classifySeverity(dtc.code, dtc.description),
    category: dtcTypeToCategory(dtc.type),
    detectedAt: new Date(),
  }));

  const pendingDtcCodes: DtcCode[] = scanResult.pendingDtcs.map((dtc, index) => ({
    id: `dtc-pending-${index}`,
    code: dtc.code,
    description: dtc.description || 'Unknown trouble code',
    status: 'pending' as const,
    severity: dtcSeverityClassifier.classifySeverity(dtc.code, dtc.description),
    category: dtcTypeToCategory(dtc.type),
    detectedAt: new Date(),
  }));

  // Update vehicle with VIN if we got one
  const updatedVehicle: Vehicle = {
    ...vehicle,
    vin: scanResult.vin.valid ? scanResult.vin.vin : vehicle.vin,
  };

  const totalCodes = activeDtcCodes.length + pendingDtcCodes.length;
  const hasIssues = totalCodes > 0 || scanResult.milStatus.milOn;

  return {
    id: `report-${Date.now()}`,
    vehicle: updatedVehicle,
    scanDate: new Date(),
    scanMileage: scanResult.odometer !== null ? kmToMiles(scanResult.odometer) : null,
    odometerEcu: scanResult.odometerEcu,
    codesLastReset: {
      milesSinceReset: scanResult.distanceSinceCleared ? kmToMiles(scanResult.distanceSinceCleared) : 0,
      daysSinceReset: scanResult.timeSinceCleared ? Math.floor(scanResult.timeSinceCleared / 1440) : 0,
      status: totalCodes > 0 ? 'codes_present' : 'clear',
      note: totalCodes > 0 ? `${totalCodes} code(s) detected` : 'No diagnostic trouble codes detected',
    },
    activeDtcCodes,
    pendingDtcCodes,
    clearedDtcCodes: [],
    emissionsCheck: {
      status: hasIssues ? 'failed' : 'passed',
      totalMonitors: 11,
      readyMonitors: hasIssues ? 8 : 11,
      notReadyMonitors: hasIssues ? 3 : 0,
      monitors: [
        { name: 'Misfire Monitor', status: hasIssues ? 'not_ready' : 'ready' },
        { name: 'Fuel System Monitor', status: 'ready' },
        { name: 'Comprehensive Component', status: 'ready' },
        { name: 'Catalyst Monitor', status: hasIssues ? 'not_ready' : 'ready' },
        { name: 'Heated Catalyst Monitor', status: 'not_applicable' },
        { name: 'Evaporative System Monitor', status: 'ready' },
        { name: 'Secondary Air System', status: 'not_applicable' },
        { name: 'A/C System Monitor', status: 'not_applicable' },
        { name: 'Oxygen Sensor Monitor', status: 'ready' },
        { name: 'Oxygen Sensor Heater', status: 'ready' },
        { name: 'EGR/VVT System Monitor', status: hasIssues ? 'not_ready' : 'ready' },
      ],
    },
    repairsNeeded: [],
    totalRepairCost: 0,
    topRepairCost: 0,
    otherRepairsCost: 0,
    scannerSerialNumber: 'VT-SM-REAL-SCAN',
    // Additional scan data from new PIDs
    warmupsSinceCleared: scanResult.warmupsSinceCleared ?? undefined,
    milesWithMILOn: scanResult.distanceWithMILOn !== null ? kmToMiles(scanResult.distanceWithMILOn) : undefined,
    loopStatus: scanResult.fuelSystemStatus ? getFuelSystemStatusLabel(scanResult.fuelSystemStatus.system1) : undefined,
    secondaryAirStatus: scanResult.secondaryAirStatus !== null ? getSecondaryAirStatusLabel(scanResult.secondaryAirStatus) : undefined,
    celStatus: scanResult.milStatus.milOn,
    dtcCountFromECU: scanResult.milStatus.dtcCount,
    // Per-ECU data for FIXD-style display
    milStatusByEcu: scanResult.milStatusByEcu,
    distanceWithMILOnByEcu: scanResult.distanceWithMILOnByEcu ? 
      Object.fromEntries(
        Object.entries(scanResult.distanceWithMILOnByEcu).map(([ecu, km]) => [ecu, kmToMiles(km)])
      ) : undefined,
    fuelSystemStatusByEcu: scanResult.fuelSystemStatusByEcu,
    secondaryAirStatusByEcu: scanResult.secondaryAirStatusByEcu,
  };
};

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation, route }) => {
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const savedReportRef = useRef<ConditionReport | null>(null);
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    { id: 'connecting', label: 'Connecting', completeLabel: 'Connected', status: 'pending', progress: 0 },
    { id: 'reading_vin', label: 'Reading VIN', completeLabel: 'VIN Read', status: 'pending', progress: 0 },
    { id: 'reading_codes', label: 'Reading Codes', completeLabel: 'Codes Read', status: 'pending', progress: 0 },
    { id: 'building_report', label: 'Building Report', completeLabel: 'Report Built', status: 'pending', progress: 0 },
  ]);
  
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const wave1Scale = useRef(new Animated.Value(0)).current;
  const wave1Opacity = useRef(new Animated.Value(0.7)).current;
  const wave2Scale = useRef(new Animated.Value(0)).current;
  const wave2Opacity = useRef(new Animated.Value(0.7)).current;
  const wave3Scale = useRef(new Animated.Value(0)).current;
  const wave3Opacity = useRef(new Animated.Value(0.7)).current;
  const wave4Scale = useRef(new Animated.Value(0)).current;
  const wave4Opacity = useRef(new Animated.Value(0.7)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const colorCycleAnim = useRef(new Animated.Value(0)).current;
  const [cancelRequested, setCancelRequested] = useState(false);
  const [stockNumber, setStockNumber] = useState('');
  const [showStockNumber, setShowStockNumber] = useState(false);
  const [vehicleOwnerName, setVehicleOwnerName] = useState('');
  const [scannerOwnerName, setScannerOwnerName] = useState('');
  const [scannerOwnerLocked, setScannerOwnerLocked] = useState(false);
  const [showAdditionalRepairs, setShowAdditionalRepairs] = useState(false);
  const [selectedAdditionalRepairs, setSelectedAdditionalRepairs] = useState<string[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string>('');
  const [errorModalStack, setErrorModalStack] = useState<string>('');
  
  // Start/stop animations based on scan status
  useEffect(() => {
    if (scanStatus === 'scanning') {
      // Smooth spin animation - using useNativeDriver: false to be consistent with other animations
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );

      // Water wave ripple: each wave starts from center (scale 0) and expands out
      // IMPORTANT: Using useNativeDriver: false because we mix with color interpolation on same views
      const createWaveAnimation = (scaleVal: Animated.Value, opacityVal: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(scaleVal, {
                toValue: 2.2,
                duration: 2400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }),
              Animated.timing(opacityVal, {
                toValue: 0,
                duration: 2400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
              }),
            ]),
            Animated.parallel([
              Animated.timing(scaleVal, { toValue: 0, duration: 0, useNativeDriver: false }),
              Animated.timing(opacityVal, { toValue: 0.6, duration: 0, useNativeDriver: false }),
            ]),
          ])
        );
      };

      const w1 = createWaveAnimation(wave1Scale, wave1Opacity, 0);
      const w2 = createWaveAnimation(wave2Scale, wave2Opacity, 600);
      const w3 = createWaveAnimation(wave3Scale, wave3Opacity, 1200);
      const w4 = createWaveAnimation(wave4Scale, wave4Opacity, 1800);

      // Glow pulsation - using useNativeDriver: false to match color interpolation
      const glowAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );

      // Color cycle: 0→1 = red flow, 1→2 = blue flow, loops
      const colorCycle = Animated.loop(
        Animated.sequence([
          Animated.timing(colorCycleAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(colorCycleAnim, { toValue: 2, duration: 3000, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(colorCycleAnim, { toValue: 0, duration: 0, useNativeDriver: false }),
        ])
      );

      spinAnimation.start();
      w1.start();
      w2.start();
      w3.start();
      w4.start();
      glowAnimation.start();
      colorCycle.start();

      return () => {
        spinAnimation.stop();
        w1.stop(); w2.stop(); w3.stop(); w4.stop();
        glowAnimation.stop();
        colorCycle.stop();
        spinValue.setValue(0);
        wave1Scale.setValue(0); wave1Opacity.setValue(0.7);
        wave2Scale.setValue(0); wave2Opacity.setValue(0.7);
        wave3Scale.setValue(0); wave3Opacity.setValue(0.7);
        wave4Scale.setValue(0); wave4Opacity.setValue(0.7);
        glowAnim.setValue(0.3);
        colorCycleAnim.setValue(0);
      };
    }
  }, [scanStatus, spinValue, wave1Scale, wave1Opacity, wave2Scale, wave2Opacity, wave3Scale, wave3Opacity, wave4Scale, wave4Opacity, glowAnim, colorCycleAnim]);
  const [showDebugModal, setShowDebugModal] = useState(false);
  
    
  const selectedVehicle = route?.params?.vehicle || null;
  const autoStart = route?.params?.autoStart || false;
  
  // Get connection state from store
  const { connectionState, setCurrentReport, addSavedReport, user, selectedBleDevice } = useAppStore();
  const isConnected = connectionState === BleConnectionState.CONNECTED;
  const hasAutoStarted = useRef(false);


  // Reset scan state when screen is focused to ensure clean slate
  // Tab screens persist in React Navigation, so we need to reset on each focus
  useFocusEffect(
    useCallback(() => {
      setScanStatus('idle');
      setProgress(0);
      setProgressMessage('');
      setScanError(null);
      setLastScanResult(null);
      savedReportRef.current = null;
      setShowDebugModal(false);
      setCancelRequested(false);
      setStockNumber('');
      setShowStockNumber(false);
      setVehicleOwnerName('');
      setScannerOwnerName('');
      setScannerOwnerLocked(false);
      setShowAdditionalRepairs(false);
      setSelectedAdditionalRepairs([]);
      setScanSteps([
        { id: 'connecting', label: 'Connecting', completeLabel: 'Connected', status: 'pending', progress: 0 },
        { id: 'reading_vin', label: 'Reading VIN', completeLabel: 'VIN Read', status: 'pending', progress: 0 },
        { id: 'reading_codes', label: 'Reading Codes', completeLabel: 'Codes Read', status: 'pending', progress: 0 },
        { id: 'building_report', label: 'Building Report', completeLabel: 'Report Built', status: 'pending', progress: 0 },
      ]);
    }, [])
  );

  // Auto-fill scanner owner name from backend when BLE device is connected
  useEffect(() => {
    const fetchScannerOwner = async () => {
      if (!isConnected || !selectedBleDevice?.id) return;
      try {
        const result = await apiService.getScannerOwner(selectedBleDevice.id);
        if (result.success && result.scannerOwnerName) {
          setScannerOwnerName(result.scannerOwnerName);
          setScannerOwnerLocked(true);
          logger.info(LogCategory.APP, 'Scanner owner auto-filled from backend', { scannerOwnerName: result.scannerOwnerName });
        }
      } catch (err) {
        logger.warn(LogCategory.APP, 'Failed to fetch scanner owner', err);
      }
    };
    fetchScannerOwner();
  }, [isConnected, selectedBleDevice?.id]);

  // Real scan using ScannerService
  const handleStartScan = useCallback(async () => {
    try {
      logger.info(LogCategory.APP, 'Starting vehicle scan');
      setScanStatus('scanning');
      setProgress(0);
      setProgressMessage('Connecting to ECU...');
      setScanError(null);
      setCancelRequested(false);
      
      // Reset scan steps
      setScanSteps([
        { id: 'connecting', label: 'Connecting', completeLabel: 'Connected', status: 'pending', progress: 0 },
        { id: 'reading_vin', label: 'Reading VIN', completeLabel: 'VIN Read', status: 'pending', progress: 0 },
        { id: 'reading_codes', label: 'Reading Codes', completeLabel: 'Codes Read', status: 'pending', progress: 0 },
        { id: 'building_report', label: 'Building Report', completeLabel: 'Report Built', status: 'pending', progress: 0 },
      ]);

      // Require real connection
      if (!isConnected) {
        setScanError('Scanner not connected. Please connect first.');
        setScanStatus('idle');
        Alert.alert('Not Connected', 'Please connect to an OBD-II scanner first from the Connect tab.');
        return;
      }
      const result = await scannerService.performScan(
        (step, progressValue, message) => {
          logger.debug(LogCategory.APP, `Scan progress: ${step} - ${progressValue}% - ${message}`);
          setProgress(progressValue);
          setProgressMessage(message);
          
          // Update scan steps based on progress - steps appear progressively with background fill
          if (step === 'initializing' || progressValue < 20) {
            // Connecting phase: 0-20%
            const stepProgress = (progressValue / 20) * 100;
            setScanSteps(prev => prev.map(s => 
              s.id === 'connecting' ? { ...s, status: 'scanning' as const, progress: stepProgress } : s
            ));
          } else if (step === 'reading_vin' || (progressValue >= 20 && progressValue < 40)) {
            // Reading VIN phase: 20-40%
            const stepProgress = ((progressValue - 20) / 20) * 100;
            setScanSteps(prev => prev.map(s => 
              s.id === 'connecting' ? { ...s, status: 'complete' as const, progress: 100 } :
              s.id === 'reading_vin' ? { ...s, status: 'scanning' as const, progress: stepProgress } : s
            ));
          } else if (step === 'reading_dtcs' || step === 'reading_mil' || (progressValue >= 40 && progressValue < 85)) {
            // Reading codes phase: 40-85%
            const stepProgress = ((progressValue - 40) / 45) * 100;
            setScanSteps(prev => prev.map(s => 
              s.id === 'connecting' ? { ...s, status: 'complete' as const, progress: 100 } :
              s.id === 'reading_vin' ? { ...s, status: 'complete' as const, progress: 100 } :
              s.id === 'reading_codes' ? { ...s, status: 'scanning' as const, progress: stepProgress } : s
            ));
          } else if (progressValue >= 85) {
            // Building report phase: 85-100%
            const stepProgress = ((progressValue - 85) / 15) * 100;
            setScanSteps(prev => prev.map(s => 
              s.id === 'connecting' ? { ...s, status: 'complete' as const, progress: 100 } :
              s.id === 'reading_vin' ? { ...s, status: 'complete' as const, progress: 100 } :
              s.id === 'reading_codes' ? { ...s, status: 'complete' as const, progress: 100 } :
              s.id === 'building_report' ? { ...s, status: 'scanning' as const, progress: stepProgress } : s
            ));
          }
        },
      );

      logger.info(LogCategory.APP, 'Scan completed successfully', {
        vinValid: result.vin.valid,
        vin: result.vin.vin,
        storedDtcs: result.storedDtcs.length,
        pendingDtcs: result.pendingDtcs.length,
        milOn: result.milStatus.milOn,
      });

      // Mark all steps complete
      setScanSteps(prev => prev.map(s => ({ ...s, status: 'complete' as const })));
      
      setLastScanResult(result);
      setScanStatus('complete');
      setProgress(100);
      setProgressMessage('Scan complete!');
      
      // Auto-save to history only if we got meaningful data (valid VIN)
      let vehicle = selectedVehicle;
      savedReportRef.current = null;
      
      const hasValidVin = result.vin.valid && result.vin.vin.length === 17;
      const hasDtcData = result.storedDtcs.length > 0 || result.pendingDtcs.length > 0;
      const hasMeaningfulData = hasValidVin || hasDtcData;
      
      if (!hasMeaningfulData) {
        logger.warn(LogCategory.APP, 'Scan returned no meaningful data (no valid VIN, no DTCs). Skipping auto-save.', {
          vinValid: result.vin.valid,
          vinValue: result.vin.vin,
          storedDtcs: result.storedDtcs.length,
          pendingDtcs: result.pendingDtcs.length,
        });
      }
      
      if (!vehicle) {
        // Decode VIN to get Year/Make/Model
        let vinInfo = result.vin.valid ? vinDecoder.decodeVIN(result.vin.vin) : null;
        
        // Try NHTSA remote decode for better vehicle info (model name etc.)
        if (result.vin.valid) {
          try {
            const nhtsaInfo = await vinDecoder.decodeVINRemote(result.vin.vin);
            if (nhtsaInfo.valid) {
              vinInfo = {
                year: nhtsaInfo.year,
                make: nhtsaInfo.make,
                model: nhtsaInfo.model,
                trim: nhtsaInfo.trim,
                valid: true,
              };
              logger.info(LogCategory.VIN, 'NHTSA decode successful', {
                year: nhtsaInfo.year,
                make: nhtsaInfo.make,
                model: nhtsaInfo.model,
                trim: nhtsaInfo.trim,
              });
            }
          } catch (nhtsaError) {
            logger.warn(LogCategory.VIN, 'NHTSA decode failed, using local decode', nhtsaError);
          }
        }
        
        vehicle = {
          id: 'vehicle-' + Date.now(),
          vin: result.vin.valid ? result.vin.vin : 'UNKNOWN',
          year: vinInfo?.year || new Date().getFullYear(),
          make: vinInfo?.make || 'Unknown',
          model: vinInfo?.model || 'Vehicle',
          trim: vinInfo?.trim || undefined,
          mileage: result.odometer !== null ? kmToMiles(result.odometer) : null,
          nickname: result.vin.valid ? `${vinInfo?.year || ''} ${vinInfo?.make || 'Vehicle'}`.trim() : 'Default Vehicle',
        };
        
        logger.info(LogCategory.APP, 'Vehicle info decoded from VIN', {
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
        });
      }
      
      const report = buildReportFromScanResult(result, vehicle);
      
      if (hasMeaningfulData) {
        addSavedReport(report);
        savedReportRef.current = report;
        logger.info(LogCategory.APP, 'Report saved to history', { reportId: report.id });
      } else {
        // Still keep the report in memory for viewing, but don't persist
        savedReportRef.current = report;
        logger.info(LogCategory.APP, 'Report built but NOT saved (no meaningful data)', { reportId: report.id });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack || '' : '';
      logger.error(LogCategory.APP, 'Scan failed', error);
      setScanError(errorMessage);
      setScanStatus('idle');
      // Show error in modal for debugging
      setErrorModalMessage(errorMessage);
      setErrorModalStack(errorStack);
      setErrorModalVisible(true);
    }
  }, [isConnected, selectedVehicle, addSavedReport]);

  // Auto-start scan effect - must be after handleStartScan is defined
  useEffect(() => {
    if (autoStart && isConnected && !hasAutoStarted.current && scanStatus === 'idle') {
      hasAutoStarted.current = true;
      logger.info(LogCategory.APP, 'Auto-starting scan');
      setTimeout(() => {
        handleStartScan();
      }, 1000);
    }
  }, [autoStart, isConnected, scanStatus, handleStartScan]);

  // Resolve vehicle from scan result
  const resolveVehicle = useCallback((): Vehicle => {
    if (selectedVehicle) return selectedVehicle;
    if (!lastScanResult) {
      return { id: 'unknown', vin: 'UNKNOWN', year: new Date().getFullYear(), make: 'Unknown', model: 'Vehicle', mileage: null };
    }
    const vinInfo = lastScanResult.vin.valid ? vinDecoder.decodeVIN(lastScanResult.vin.vin) : null;
    return {
      id: 'vehicle-' + Date.now(),
      vin: lastScanResult.vin.valid ? lastScanResult.vin.vin : 'UNKNOWN',
      year: vinInfo?.year || new Date().getFullYear(),
      make: vinInfo?.make || 'Unknown',
      model: vinInfo?.model || 'Vehicle',
      mileage: lastScanResult.odometer !== null ? kmToMiles(lastScanResult.odometer) : null,
      nickname: lastScanResult.vin.valid ? `${vinInfo?.year || ''} ${vinInfo?.make || 'Vehicle'}`.trim() : 'Default Vehicle',
    };
  }, [lastScanResult, selectedVehicle]);

  // Clear vehicle light (MIL) - send OBD-II Mode 04 command
  const handleClearVehicleLight = useCallback(async () => {
    Alert.alert(
      'Clear Vehicle Light',
      'This will clear all diagnostic trouble codes and turn off the check engine light. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              logger.info(LogCategory.APP, 'User requested clear vehicle light');
              const success = await scannerService.clearDTCs();
              if (success) {
                Alert.alert('Success', 'Vehicle light cleared successfully. The check engine light should turn off.');
                logger.info(LogCategory.APP, 'Vehicle light cleared successfully');
              } else {
                Alert.alert('Failed', 'Could not clear vehicle light. Please try again.');
                logger.warn(LogCategory.APP, 'Clear vehicle light returned false');
              }
            } catch (error) {
              const msg = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Error', `Failed to clear vehicle light: ${msg}`);
              logger.error(LogCategory.APP, 'Clear vehicle light failed', error);
            }
          },
        },
      ]
    );
  }, []);

  // View Full Report: send scan data to backend for AI processing
  const handleViewFullReport = useCallback(() => {
    if (!lastScanResult) {
      Alert.alert('No Scan Data', 'Please complete a scan first.');
      return;
    }
    // Validate stock number if provided (up to 20 digits, or empty)
    const trimmedStock = stockNumber.trim();
    logger.info(LogCategory.APP, 'Full Report navigation requested', {
      stockNumberInput: stockNumber,
      trimmedStock,
      isValid: trimmedStock.length === 0 || trimmedStock.length <= 20,
    });
    if (trimmedStock.length > 20) {
      logger.warn(LogCategory.APP, 'Invalid stock number - exceeds 20 digits', {
        stockNumber: trimmedStock,
        length: trimmedStock.length,
      });
      Alert.alert('Invalid Stock Number', 'Stock number must be 20 digits or fewer.');
      return;
    }
    logger.info(LogCategory.APP, 'Navigating to Full Report', {
      hasStockNumber: trimmedStock.length > 0,
      stockNumber: trimmedStock || undefined,
    });
    // Reuse the saved report to avoid creating duplicate entries with different IDs
    const conditionReport = savedReportRef.current || buildReportFromScanResult(lastScanResult, resolveVehicle());
    const vehicle = conditionReport.vehicle;
    setCurrentReport(conditionReport);
    navigation.navigate('FullReport', {
      scanResult: lastScanResult,
      vehicle,
      conditionReport,
      stockNumber: trimmedStock.length > 0 ? trimmedStock : undefined,
      additionalRepairs: selectedAdditionalRepairs.length > 0 ? selectedAdditionalRepairs : undefined,
      vehicleOwnerName: vehicleOwnerName.trim() || undefined,
      scannerOwnerName: scannerOwnerName.trim() || undefined,
    });
  }, [lastScanResult, resolveVehicle, navigation, setCurrentReport, stockNumber, selectedAdditionalRepairs, vehicleOwnerName, scannerOwnerName]);

  // Cancel scan
  const handleCancelScan = useCallback(() => {
    Alert.alert(
      'Cancel Scan',
      'Are you sure you want to cancel the scan?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            // Actually cancel the scan in ScannerService
            scannerService.cancelScan();
            
            // Update UI state
            setCancelRequested(true);
            setScanStatus('idle');
            setProgress(0);
            setProgressMessage('');
            
            // Reset scan steps
            setScanSteps([
              { id: 'connecting', label: 'Connecting', completeLabel: 'Connected', status: 'pending', progress: 0 },
              { id: 'reading_vin', label: 'Reading VIN', completeLabel: 'VIN Read', status: 'pending', progress: 0 },
              { id: 'reading_codes', label: 'Reading Codes', completeLabel: 'Codes Read', status: 'pending', progress: 0 },
              { id: 'building_report', label: 'Building Report', completeLabel: 'Report Built', status: 'pending', progress: 0 },
            ]);
            
            logger.info(LogCategory.APP, 'Scan cancelled by user');
          },
        },
      ]
    );
  }, []);
  
  const getProgressMessage = () => {
    return progressMessage || 'Initializing...';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vehicle Scan</Text>
          <Text style={styles.headerSubtitle}>
            Diagnose your vehicle's health
          </Text>
        </View>

        {/* Selected Vehicle Card */}
        {selectedVehicle && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Selected Vehicle</Text>
            <VehicleCard
              vehicle={selectedVehicle}
              showMileage
              showVin
              selected
            />
          </View>
        )}

        {/* Scan Button and Progress */}
        <View style={styles.scanSection}>
          {scanStatus === 'idle' && (
            <View style={styles.idleScanContainer}>
              <TouchableOpacity 
                onPress={() => {
                  if (!vehicleOwnerName.trim()) {
                    Alert.alert('Vehicle Owner Required', 'Please enter the vehicle owner name before scanning.');
                    return;
                  }
                  handleStartScan();
                }}
                activeOpacity={vehicleOwnerName.trim() ? 0.8 : 1}
                style={[styles.scanImageButton, !vehicleOwnerName.trim() && { opacity: 0.4 }]}
              >
                <Image
                  source={require('../assets/images/scan.png')}
                  style={styles.scanImage}
                  resizeMode="contain"
                />
                <Text style={styles.scanButtonHint}>Tap to Start OBD2 Scan</Text>
              </TouchableOpacity>

              {/* Vehicle Owner Name Input */}
              <View style={styles.preScanInputContainer}>
                <Text style={styles.preScanInputLabel}>Vehicle Owner Name *</Text>
                <TextInput
                  style={styles.preScanInput}
                  placeholder="Enter vehicle owner name"
                  placeholderTextColor={colors.text.muted}
                  value={vehicleOwnerName}
                  onChangeText={setVehicleOwnerName}
                  autoCapitalize="words"
                  maxLength={100}
                />
              </View>

              {/* Scanner Owner Name Input */}
              <View style={styles.preScanInputContainer}>
                <Text style={styles.preScanInputLabel}>Scanner Owner Name</Text>
                <TextInput
                  style={[styles.preScanInput, scannerOwnerLocked && styles.preScanInputLocked]}
                  placeholder="Enter scanner owner name"
                  placeholderTextColor={colors.text.muted}
                  value={scannerOwnerName}
                  onChangeText={scannerOwnerLocked ? undefined : setScannerOwnerName}
                  editable={!scannerOwnerLocked}
                  autoCapitalize="words"
                  maxLength={100}
                />
                {scannerOwnerLocked && (
                  <Text style={styles.preScanInputHint}>Auto-filled from previous scan</Text>
                )}
              </View>
            </View>
          )}

          {scanStatus === 'scanning' && (
            <View style={styles.progressContainer}>
              {/* Spinning Star with Water Wave Ripples + Glow */}
              <View style={styles.scanAnimationContainer}>
                {/* Water wave ripple rings with color cycling */}
                {[
                  { scale: wave1Scale, opacity: wave1Opacity },
                  { scale: wave2Scale, opacity: wave2Opacity },
                  { scale: wave3Scale, opacity: wave3Opacity },
                  { scale: wave4Scale, opacity: wave4Opacity },
                ].map((wave, idx) => (
                  <Animated.View
                    key={`wave-${idx}`}
                    style={[
                      styles.waveRing,
                      {
                        transform: [{ scale: wave.scale }],
                        opacity: wave.opacity,
                        borderColor: colorCycleAnim.interpolate({
                          inputRange: [0, 0.5, 1, 1.5, 2],
                          outputRange: [
                            '#DC2626',  // red
                            '#EF4444',  // light red
                            '#FFFFFF',  // white (transition)
                            '#60A5FA',  // light blue
                            '#2563EB',  // blue
                          ],
                        }),
                      },
                    ]}
                  />
                ))}
                {/* Glow behind star */}
                <Animated.View
                  style={[
                    styles.starGlow,
                    {
                      opacity: glowAnim,
                      shadowColor: colorCycleAnim.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: ['#DC2626', '#2563EB', '#DC2626'],
                      }),
                      backgroundColor: colorCycleAnim.interpolate({
                        inputRange: [0, 0.5, 1, 1.5, 2],
                        outputRange: [
                          'rgba(220,38,38,0.15)',
                          'rgba(239,68,68,0.10)',
                          'rgba(255,255,255,0.08)',
                          'rgba(96,165,250,0.10)',
                          'rgba(37,99,235,0.15)',
                        ],
                      }),
                    },
                  ]}
                />
                {/* Spinning star image - centered */}
                <Animated.Image
                  source={require('../assets/images/scan.png')}
                  style={[
                    styles.scanningStar,
                    {
                      transform: [
                        { rotate: spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
              
              <Text style={styles.scanningTitle}>Scanning...</Text>
              <Text style={styles.scanStepsNote}>
                Some vehicles can take up to 4 minutes to fully scan. Please do not close the app.
              </Text>
              
              {/* Progressive Scan Steps */}
              <View style={styles.scanStepsContainer}>
                {scanSteps.filter(step => step.status !== 'pending').map((step) => {
                  const getStepIcon = () => {
                    if (step.status === 'complete') {
                      return <CheckIcon width={20} height={20} color={colors.primary.navy} />;
                    }
                    switch (step.id) {
                      case 'connecting': return <ConnectingIcon width={20} height={20} color={colors.primary.navy} />;
                      case 'reading_vin': return <ReadingVinIcon width={20} height={20} color={colors.primary.navy} />;
                      case 'reading_codes': return <ReadingCodeIcon width={20} height={20} color={colors.primary.navy} />;
                      case 'building_report': return <BuildingReportIcon width={20} height={20} color={colors.primary.navy} />;
                      default: return <ConnectingIcon width={20} height={20} color={colors.primary.navy} />;
                    }
                  };
                  
                  // Calculate step progress for background fill
                  const stepProgress = step.status === 'complete' ? 100 : step.progress;
                  
                  return (
                    <View key={step.id} style={styles.scanStepItem}>
                      {/* Background progress fill */}
                      <View style={[styles.scanStepProgressFill, { width: `${stepProgress}%` }]} />
                      <View style={styles.scanStepContent}>
                        <View style={styles.scanStepIconContainer}>
                          {getStepIcon()}
                        </View>
                        <Text style={styles.scanStepLabel}>
                          {step.status === 'complete' ? step.completeLabel : step.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              
              {/* Cancel Button */}
              <Button
                title="Cancel Scan"
                onPress={handleCancelScan}
                variant="secondary"
                size="medium"
                fullWidth
                style={styles.cancelButton}
              />
            </View>
          )}

          {scanStatus === 'complete' && lastScanResult && (
            <View style={styles.completeContainer}>
              <View style={styles.completeIcon}>
                <CheckIcon width={40} height={40} color={colors.text.inverse} />
              </View>
              <Text style={styles.completeTitle}>Scan Complete!</Text>
              <Text style={styles.completeSubtitle}>
                {lastScanResult.storedDtcs.length > 0 || lastScanResult.pendingDtcs.length > 0 
                  ? 'We found some items that need your attention' 
                  : 'No issues detected with your vehicle'}
              </Text>
              <View style={styles.completeButtons}>
                <Button
                  title="Clear Vehicle Light"
                  onPress={handleClearVehicleLight}
                  variant="secondary"
                  size="medium"
                  fullWidth
                />
                <Button
                  title="View Full Report"
                  onPress={handleViewFullReport}
                  variant="primary"
                  size="large"
                  fullWidth
                  style={styles.secondaryButton}
                />

                {/* Additional Repairs Toggle */}
                <View style={styles.additionalRepairsContainer}>
                  <TouchableOpacity
                    style={styles.additionalRepairsToggle}
                    onPress={() => setShowAdditionalRepairs(!showAdditionalRepairs)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.additionalRepairsToggleText}>Additional Repairs</Text>
                    <View style={[styles.toggleSwitch, showAdditionalRepairs && styles.toggleSwitchOn]}>
                      <View style={[styles.toggleKnob, showAdditionalRepairs && styles.toggleKnobOn]} />
                    </View>
                  </TouchableOpacity>
                  {showAdditionalRepairs && (
                    <View style={styles.additionalRepairsList}>
                      {[
                        'Tire Inspection & Replacement',
                        'Battery Diagnostics & Replacement',
                        'Windshield Replacement Services',
                        'Windshield Chip & Crack Repair',
                        'Interior & Exterior Detailing',
                        'Auto Body & Collision Repair',
                        'Interior Odor Elimination',
                        'Seat & Upholstery Restoration',
                        'Missing Spare Key',
                      ].map((item) => {
                        const isSelected = selectedAdditionalRepairs.includes(item);
                        return (
                          <TouchableOpacity
                            key={item}
                            style={styles.repairCheckboxRow}
                            onPress={() => {
                              setSelectedAdditionalRepairs((prev) =>
                                isSelected ? prev.filter((r) => r !== item) : [...prev, item]
                              );
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                              {isSelected && <Text style={styles.checkboxCheck}>✓</Text>}
                            </View>
                            <Text style={styles.repairCheckboxLabel}>{item}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                <View style={styles.stockNumberContainer}>
                  <TouchableOpacity
                    style={styles.stockNumberToggle}
                    onPress={() => setShowStockNumber(!showStockNumber)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.stockNumberToggleText}>Stock Number</Text>
                    <View style={[styles.toggleSwitch, showStockNumber && styles.toggleSwitchOn]}>
                      <View style={[styles.toggleKnob, showStockNumber && styles.toggleKnobOn]} />
                    </View>
                  </TouchableOpacity>
                  {showStockNumber && (
                    <View style={styles.stockNumberInputWrap}>
                      <TextInput
                        style={styles.stockNumberInput}
                        placeholder="Enter stock number"
                        placeholderTextColor={colors.text.muted}
                        value={stockNumber}
                        onChangeText={(text) => {
                          // Allow only digits, max 20
                          const cleaned = text.replace(/[^0-9]/g, '').slice(0, 20);
                          logger.debug(LogCategory.APP, 'Stock number input changed', {
                            input: text,
                            cleaned,
                            length: cleaned.length,
                          });
                          setStockNumber(cleaned);
                        }}
                        keyboardType="numeric"
                        maxLength={20}
                      />
                      {stockNumber.length > 0 && (
                        <Text style={styles.stockNumberValid}>
                          {stockNumber.length}/20 digit{stockNumber.length !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Vehicle Owner Name - display only (entered before scan) */}
                {vehicleOwnerName.trim() ? (
                  <View style={styles.stockNumberContainer}>
                    <Text style={styles.stockNumberToggleText}>Vehicle Owner</Text>
                    <Text style={[styles.stockNumberValid, { marginTop: 4 }]}>{vehicleOwnerName}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </View>

        {/* Scan Tips - Only show when idle */}
        {scanStatus === 'idle' && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <TipIcon width={25} height={25} color={colors.status.info} />
              <Text style={styles.tipsTitle}>Before Scanning</Text>
            </View>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>
                • Enter vehicle owner name above before scanning
              </Text>
              <Text style={styles.tipItem}>
                • Engine should be running or ignition on
              </Text>
              <Text style={styles.tipItem}>
                • Vehicle should be stationary
              </Text>
              <Text style={styles.tipItem}>
                • Allow 2-3 minutes for complete scan
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Debug Data Screen */}
      <DebugDataScreen
        visible={showDebugModal}
        onClose={() => setShowDebugModal(false)}
      />

      {/* Error Logging Modal */}
      <Modal
        visible={errorModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContent}>
            <Text style={styles.errorModalTitle}>Scan Error</Text>
            <ScrollView style={styles.errorModalScrollView}>
              <Text style={styles.errorModalLabel}>Error Message:</Text>
              <Text style={styles.errorModalText}>{errorModalMessage}</Text>
              {errorModalStack.length > 0 && (
                <>
                  <Text style={[styles.errorModalLabel, { marginTop: spacing.md }]}>Stack Trace:</Text>
                  <Text style={styles.errorModalStackText}>{errorModalStack}</Text>
                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.errorModalCloseButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorModalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.styles.label,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  scanSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  idleScanContainer: {
    alignItems: 'center',
    width: '100%',
  },
  scanImageButton: {
    alignItems: 'center',
  },
  
  scanImage: {
    width: 180,
    height: 180,
  },
  scanButtonHint: {
    ...typography.styles.label,
    color: colors.primary.navy,
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.semiBold,
  },
  preScanInputContainer: {
    width: '100%',
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.inputRadius,
    padding: spacing.md,
  },
  preScanInputLabel: {
    ...typography.styles.label,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
    marginBottom: spacing.xs,
  },
  preScanInput: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.inputRadius,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.styles.body,
    color: colors.text.primary,
  },
  preScanInputLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: colors.border.medium,
    color: colors.text.secondary,
  },
  preScanInputHint: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  scanAnimationContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  waveRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: '#DC2626',
    backgroundColor: 'transparent',
  },
  starGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 10,
  },
  scanningStar: {
    width: 120,
    height: 120,
  },
  scanningTitle: {
    ...typography.styles.h3,
    color: colors.primary.navy,
    marginBottom: spacing.sm,
  },
  scanStepsContainer: {
    width: '100%',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  scanStepsNote: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scanStepItem: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.inputRadius,
  },
  scanStepProgressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: colors.status.infoLight,
  },
  scanStepContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  scanStepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanStepLabel: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
  },
  completeContainer: {
    alignItems: 'center',
    width: '100%',
  },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completeTitle: {
    ...typography.styles.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  completeSubtitle: {
    ...typography.styles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  completeButtons: {
    width: '100%',
    gap: spacing.md,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.xl,
  },
  mockSection: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  mockHint: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  noCodes: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  noCodesText: {
    ...typography.styles.body,
    color: colors.text.muted,
  },
  tipsCard: {
    backgroundColor: colors.status.infoLight,
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
  // Additional Repairs
  additionalRepairsContainer: {
    width: '100%',
    marginTop: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.inputRadius,
    padding: spacing.md,
  },
  additionalRepairsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalRepairsToggleText: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border.medium,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: colors.primary.navy,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  additionalRepairsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  repairCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  checkboxChecked: {
    backgroundColor: colors.primary.navy,
    borderColor: colors.primary.navy,
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  repairCheckboxLabel: {
    ...typography.styles.bodySmall,
    color: colors.text.primary,
    flex: 1,
  },
  stockNumberContainer: {
    width: '100%',
    marginTop: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: spacing.inputRadius,
    padding: spacing.md,
  },
  stockNumberToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockNumberToggleText: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
  },
  stockNumberInputWrap: {
    marginTop: spacing.md,
  },
  stockNumberInput: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.inputRadius,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.styles.body,
    color: colors.text.primary,
  },
  stockNumberHint: {
    ...typography.styles.caption,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  stockNumberValid: {
    ...typography.styles.caption,
    color: colors.status.success,
    marginTop: spacing.xs,
    fontWeight: '600' as const,
  },
  // Error Modal Styles
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.cardRadius,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '80%',
  },
  errorModalTitle: {
    ...typography.styles.h3,
    color: colors.status.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorModalScrollView: {
    maxHeight: 300,
  },
  errorModalLabel: {
    ...typography.styles.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  errorModalText: {
    ...typography.styles.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: spacing.inputRadius,
  },
  errorModalStackText: {
    ...typography.styles.caption,
    color: colors.text.muted,
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: spacing.inputRadius,
    fontFamily: 'monospace',
  },
  errorModalCloseButton: {
    backgroundColor: colors.primary.navy,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.inputRadius,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  errorModalCloseButtonText: {
    ...typography.styles.button,
    color: colors.text.inverse,
  },
});
