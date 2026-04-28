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
import CodeResetIcon from '../assets/icons/codereset.svg';
import ScanInfoIcon from '../assets/icons/scaninfo.svg';
import { RadialLightRays } from '../components/RadialLightRays';

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
  
  // Animation value for the spinning star (rotation only).
  const spinValue = useRef(new Animated.Value(0)).current;
  const [cancelRequested, setCancelRequested] = useState(false);
  const [stockNumber, setStockNumber] = useState('');
  const [showStockNumber, setShowStockNumber] = useState(false);
  const [vehicleOwnerName, setVehicleOwnerName] = useState('');
  const [showAdditionalRepairs, setShowAdditionalRepairs] = useState(false);
  const [selectedAdditionalRepairs, setSelectedAdditionalRepairs] = useState<string[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string>('');
  const [errorModalStack, setErrorModalStack] = useState<string>('');
  
  // Spin the star while scanning. Native driver is fine since we only animate
  // rotation (the rays + glow live inside RadialLightRays and animate themselves).
  useEffect(() => {
    if (scanStatus !== 'scanning') {
      return;
    }
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinAnimation.start();
    return () => {
      spinAnimation.stop();
      spinValue.setValue(0);
    };
  }, [scanStatus, spinValue]);
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
      'This will attempt to clear all non-permanent diagnostic trouble codes and turn off the check engine light. Permanent codes (stored in-permanent memory) can only clear after the fault is physically repaired and the relevant monitor runs. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              logger.info(LogCategory.APP, 'User requested clear vehicle light');
              const result = await scannerService.clearDTCs();
              if (result.success) {
                // Multi-ECU vehicles can return MIXED replies — some modules
                // accept the clear and others reject it. The service layer
                // marks that case with `partial: true` and composes a
                // detailed `message`; we surface it under a different title
                // so the user understands the outcome isn't a failure but
                // also isn't a full-bus clear.
                if (result.partial) {
                  Alert.alert(
                    'Partially Cleared',
                    result.message ??
                      'Some vehicle modules accepted the clear request and others did not. The check-engine light should turn off after the next key cycle if the engine module accepted.',
                  );
                  logger.info(LogCategory.APP, 'Vehicle light partially cleared', {
                    positiveEcus: result.positiveEcus,
                    negativeEcus: result.negativeEcus,
                  });
                } else {
                  Alert.alert(
                    'Success',
                    'Vehicle light cleared successfully. The check engine light should turn off after the next key cycle.',
                  );
                  logger.info(LogCategory.APP, 'Vehicle light cleared successfully', {
                    positiveEcus: result.positiveEcus,
                  });
                }
                return;
              }

              // Structured, user-facing reasons so the user understands WHY
              // the ECU rejected the clear request.
              logger.warn(LogCategory.APP, 'Clear vehicle light rejected', {
                reason: result.reason,
                nrc: result.nrc,
                permanentDtcs: result.permanentDtcs,
              });

              if (result.reason === 'permanent-dtc') {
                Alert.alert(
                  'Repair Required',
                  result.message ??
                    'Cannot clear — permanent diagnostic codes are stored on this vehicle. Per OBD-II spec, these only clear after the physical repair is made and the relevant readiness monitor runs successfully.',
                );
              } else if (result.reason === 'nrc-22') {
                Alert.alert(
                  'Vehicle Not Ready',
                  result.message ??
                    'Vehicle rejected the clear request (conditions not correct). Turn the ignition to ON with the engine OFF and try again.',
                );
              } else if (result.nrc) {
                Alert.alert(
                  'Clear Rejected',
                  result.message ?? `Vehicle rejected clear request (NRC 0x${result.nrc}).`,
                );
              } else {
                Alert.alert(
                  'Clear Failed',
                  result.message ?? 'Could not clear vehicle light. Please try again.',
                );
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
    });
  }, [lastScanResult, resolveVehicle, navigation, setCurrentReport, stockNumber, selectedAdditionalRepairs, vehicleOwnerName]);

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

                          </View>
          )}

          {scanStatus === 'scanning' && (
            <View style={styles.progressContainer}>
              {/* Spinning star with modern radial light-ray animation */}
              <View style={styles.scanAnimationContainer}>
                {/* Colored rays + pulsing glow (own animation lifecycle) */}
                <RadialLightRays size={260} innerRadius={96} active />

                {/* Spinning star image - matches idle size, pivots on visual centroid */}
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
                {/* Clear Vehicle Light action card */}
                <TouchableOpacity
                  onPress={handleClearVehicleLight}
                  activeOpacity={0.85}
                  style={styles.actionCard}
                >
                  <View style={styles.actionCardIconBadge}>
                    <CodeResetIcon width={24} height={24} color={colors.primary.navy} />
                  </View>
                  <View style={styles.actionCardTextWrap}>
                    <Text style={styles.actionCardTitle}>Clear Vehicle Light</Text>
                    <Text style={styles.actionCardSubtitle}>Turn off the check engine light</Text>
                  </View>
                  <Text style={styles.actionCardChevron}>›</Text>
                </TouchableOpacity>

                {/* View Full Report primary action card */}
                <TouchableOpacity
                  onPress={handleViewFullReport}
                  activeOpacity={0.9}
                  style={[styles.actionCard, styles.actionCardPrimary]}
                >
                  <View style={styles.actionCardHighlight} pointerEvents="none" />
                  <View style={[styles.actionCardIconBadge, styles.actionCardIconBadgePrimary]}>
                    <ScanInfoIcon width={22} height={22} color={colors.text.inverse} />
                  </View>
                  <View style={styles.actionCardTextWrap}>
                    <Text style={[styles.actionCardTitle, styles.actionCardTitlePrimary]}>
                      View Full Report
                    </Text>
                    <Text style={[styles.actionCardSubtitle, styles.actionCardSubtitlePrimary]}>
                      See diagnostics, costs & repairs
                    </Text>
                  </View>
                  <Text style={[styles.actionCardChevron, styles.actionCardChevronPrimary]}>›</Text>
                </TouchableOpacity>

                {/* Additional Repairs card */}
                <View style={styles.additionalRepairsContainer}>
                  <TouchableOpacity
                    style={styles.additionalRepairsToggle}
                    onPress={() => setShowAdditionalRepairs(!showAdditionalRepairs)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.additionalRepairsHeaderLeft}>
                      <View style={styles.additionalRepairsIconBadge}>
                        <ToolIcon width={18} height={18} color={colors.primary.navy} />
                      </View>
                      <Text
                        style={styles.additionalRepairsToggleText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Additional Repairs
                      </Text>
                    </View>
                    <View style={[styles.toggleSwitch, showAdditionalRepairs && styles.toggleSwitchOn]}>
                      <View style={[styles.toggleKnob, showAdditionalRepairs && styles.toggleKnobOn]} />
                    </View>
                  </TouchableOpacity>
                  {selectedAdditionalRepairs.length > 0 && (
                    <View style={styles.selectedCountChipRow}>
                      <View style={styles.selectedCountChip}>
                        <Text style={styles.selectedCountChipText}>
                          {selectedAdditionalRepairs.length} selected
                        </Text>
                      </View>
                    </View>
                  )}
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
                      ].map((item, idx, arr) => {
                        const isSelected = selectedAdditionalRepairs.includes(item);
                        const isLast = idx === arr.length - 1;
                        return (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.repairCheckboxRow,
                              !isLast && styles.repairCheckboxRowDivider,
                            ]}
                            onPress={() => {
                              setSelectedAdditionalRepairs((prev) =>
                                isSelected ? prev.filter((r) => r !== item) : [...prev, item]
                              );
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                              {isSelected && (
                                <CheckIcon width={14} height={14} color={colors.text.inverse} />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.repairCheckboxLabel,
                                isSelected && styles.repairCheckboxLabelSelected,
                              ]}
                            >
                              {item}
                            </Text>
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
                    <View style={styles.stockNumberHeaderLeft}>
                      <View style={styles.stockNumberIconBadge}>
                        <BuildingReportIcon width={18} height={18} color={colors.primary.navy} />
                      </View>
                      <Text style={styles.stockNumberToggleText}>Stock Number</Text>
                    </View>
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
                    <View style={styles.stockNumberHeaderLeft}>
                      <View style={styles.stockNumberIconBadge}>
                        <ReadingVinIcon width={18} height={18} color={colors.primary.navy} />
                      </View>
                      <Text style={styles.stockNumberToggleText}>Vehicle Owner</Text>
                    </View>
                    <Text
                      style={[styles.stockNumberValid, { marginTop: 6, marginLeft: 40 }]}
                    >
                      {vehicleOwnerName}
                    </Text>
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
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scanningStar: {
    width: 180,
    height: 180,
    // 5-point star centroid sits ~5% below the image bounding-box centre
    // (top tip is farther from centre than the two bottom tips). Shift the
    // rotation pivot down so the star spins cleanly around its visual centre
    // instead of wobbling.
    transformOrigin: '50% 55%',
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
  cancelButton: {
    marginTop: spacing.xl,
  },
  // Modern action cards (Clear Vehicle Light / View Full Report)
  actionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  actionCardPrimary: {
    backgroundColor: colors.primary.red,
    borderColor: colors.primary.redDark,
    shadowColor: colors.primary.red,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  actionCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionCardIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.status.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionCardIconBadgePrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  actionCardTextWrap: {
    flex: 1,
  },
  actionCardTitle: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.md,
  },
  actionCardTitlePrimary: {
    color: colors.text.inverse,
  },
  actionCardSubtitle: {
    ...typography.styles.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  actionCardSubtitlePrimary: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  actionCardChevron: {
    fontSize: 30,
    lineHeight: 30,
    color: colors.text.muted,
    marginLeft: spacing.sm,
    fontWeight: '400',
  },
  actionCardChevronPrimary: {
    color: 'rgba(255, 255, 255, 0.9)',
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
  // Additional Repairs — modern card style
  additionalRepairsContainer: {
    width: '100%',
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  additionalRepairsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  additionalRepairsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  additionalRepairsIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.status.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  additionalRepairsToggleText: {
    ...typography.styles.body,
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.bold,
  },
  selectedCountChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginLeft: 32 + spacing.sm, // align with text (icon badge width + gap)
  },
  selectedCountChip: {
    backgroundColor: colors.primary.red,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  selectedCountChipText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.2,
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border.light,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleSwitchOn: {
    backgroundColor: colors.primary.red,
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobOn: {
    alignSelf: 'flex-end',
  },
  additionalRepairsList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.xs,
  },
  repairCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  repairCheckboxRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    color: colors.text.secondary,
    flex: 1,
  },
  repairCheckboxLabelSelected: {
    color: colors.primary.navy,
    fontWeight: typography.fontWeight.semiBold,
  },
  stockNumberContainer: {
    width: '100%',
    marginTop: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  stockNumberToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockNumberHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  stockNumberIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.status.infoLight,
    justifyContent: 'center',
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
