// ScanScreen for VinTraxx SmartScan
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
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
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    { id: 'connecting', label: 'Connecting', completeLabel: 'Connected', status: 'pending', progress: 0 },
    { id: 'reading_vin', label: 'Reading VIN', completeLabel: 'VIN Read', status: 'pending', progress: 0 },
    { id: 'reading_codes', label: 'Reading Codes', completeLabel: 'Codes Read', status: 'pending', progress: 0 },
    { id: 'building_report', label: 'Building Report', completeLabel: 'Report Built', status: 'pending', progress: 0 },
  ]);
  
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue1 = useRef(new Animated.Value(1)).current;
  const pulseValue2 = useRef(new Animated.Value(1)).current;
  const pulseValue3 = useRef(new Animated.Value(1)).current;
  const [cancelRequested, setCancelRequested] = useState(false);
  
  // Start/stop animations based on scan status
  useEffect(() => {
    if (scanStatus === 'scanning') {
      // Spin animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      // Triple pulse animation - staggered for continuous smooth effect
      const createPulseAnimation = (pulseVal: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(pulseVal, {
              toValue: 1.5,
              duration: 1500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseVal, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        );
      };
      
      const pulse1 = createPulseAnimation(pulseValue1, 0);
      const pulse2 = createPulseAnimation(pulseValue2, 500);
      const pulse3 = createPulseAnimation(pulseValue3, 1000);
      
      spinAnimation.start();
      pulse1.start();
      pulse2.start();
      pulse3.start();
      
      return () => {
        spinAnimation.stop();
        pulse1.stop();
        pulse2.stop();
        pulse3.stop();
        spinValue.setValue(0);
        pulseValue1.setValue(1);
        pulseValue2.setValue(1);
        pulseValue3.setValue(1);
      };
    }
  }, [scanStatus, spinValue, pulseValue1, pulseValue2, pulseValue3]);
  const [showDebugModal, setShowDebugModal] = useState(false);
  
    
  const selectedVehicle = route?.params?.vehicle || null;
  const autoStart = route?.params?.autoStart || false;
  
  // Get connection state from store
  const { connectionState, setCurrentReport, addSavedReport, user } = useAppStore();
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
      setShowDebugModal(false);
      setCancelRequested(false);
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

    try {
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
      
      // Auto-save to history
      let vehicle = selectedVehicle;
      
      if (!vehicle) {
        // Decode VIN to get Year/Make/Model
        const vinInfo = result.vin.valid ? vinDecoder.decodeVIN(result.vin.vin) : null;
        
        vehicle = {
          id: 'vehicle-' + Date.now(),
          vin: result.vin.valid ? result.vin.vin : 'UNKNOWN',
          year: vinInfo?.year || new Date().getFullYear(),
          make: vinInfo?.make || 'Unknown',
          model: vinInfo?.model || 'Vehicle',
          mileage: result.odometer !== null ? kmToMiles(result.odometer) : null,
          nickname: result.vin.valid ? `${vinInfo?.year || ''} ${vinInfo?.make || 'Vehicle'}`.trim() : 'Default Vehicle',
        };
        
        logger.info(LogCategory.APP, 'Vehicle info decoded from VIN', {
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
        });
      }
      
      const report = buildReportFromScanResult(result, vehicle);
      addSavedReport(report);
      logger.info(LogCategory.APP, 'Report saved to history');
      
      // Scan data will be sent to backend when user taps "View Full Report"
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(LogCategory.APP, 'Scan failed', error);
      setScanError(errorMessage);
      setScanStatus('idle');
      Alert.alert('Scan Failed', errorMessage);
    }
  }, [isConnected, selectedVehicle, addSavedReport, user]);

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

  // View Clean Report: direct scanned data only, no AI
  const handleViewCleanReport = useCallback(() => {
    if (!lastScanResult) {
      Alert.alert('No Scan Data', 'Please complete a scan first.');
      return;
    }
    const vehicle = resolveVehicle();
    const report = buildReportFromScanResult(lastScanResult, vehicle);
    setCurrentReport(report);
    navigation.navigate('CleanReport', { report });
  }, [lastScanResult, resolveVehicle, navigation, setCurrentReport]);

  // View Full Report: send scan data to backend for AI processing
  const handleViewFullReport = useCallback(() => {
    if (!lastScanResult) {
      Alert.alert('No Scan Data', 'Please complete a scan first.');
      return;
    }
    const vehicle = resolveVehicle();
    navigation.navigate('FullReport', { scanResult: lastScanResult, vehicle });
  }, [lastScanResult, resolveVehicle, navigation]);

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
            <TouchableOpacity 
              onPress={handleStartScan}
              activeOpacity={0.8}
              style={styles.scanImageButton}
            >
              <Image
                source={require('../assets/images/scan.png')}
                style={styles.scanImage}
                resizeMode="contain"
              />
              <Text style={styles.scanButtonHint}>Tap to Start Scan</Text>
            </TouchableOpacity>
          )}

          {scanStatus === 'scanning' && (
            <View style={styles.progressContainer}>
              {/* Spinning Star with Triple Pulse */}
              <View style={styles.scanAnimationContainer}>
                <Animated.View style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseValue1 }], opacity: pulseValue1.interpolate({ inputRange: [1, 1.5], outputRange: [0.5, 0] }) }
                ]} />
                <Animated.View style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseValue2 }], opacity: pulseValue2.interpolate({ inputRange: [1, 1.5], outputRange: [0.5, 0] }) }
                ]} />
                <Animated.View style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseValue3 }], opacity: pulseValue3.interpolate({ inputRange: [1, 1.5], outputRange: [0.5, 0] }) }
                ]} />
                <Animated.Image
                  source={require('../assets/images/scan.png')}
                  style={[
                    styles.scanningStar,
                    { transform: [{ rotate: spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }
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
                  title="View Clean Report"
                  onPress={handleViewCleanReport}
                  variant="primary"
                  size="large"
                  fullWidth
                />
                <Button
                  title="View Full Report"
                  onPress={handleViewFullReport}
                  variant="secondary"
                  size="medium"
                  fullWidth
                  style={styles.secondaryButton}
                />
                <Button
                  title="View Debug Data"
                  onPress={() => setShowDebugModal(true)}
                  variant="secondary"
                  size="medium"
                  fullWidth
                  style={styles.secondaryButton}
                />
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
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  scanAnimationContainer: {
    width: 190,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pulseCircle: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.primary.navy,
  },
  scanningStar: {
    width: 180,
    height: 180,
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
});
