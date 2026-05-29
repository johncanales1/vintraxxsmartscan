// WorkflowSelectorScreen — choose between BLE OBD Scan and GPS OBD Scan.
//
// Displayed immediately after login. The user taps one of two large cards to
// enter the corresponding workflow. The choice is stored in `appStore.workflowMode`
// and the RootNavigator reactively mounts the correct tab navigator.

import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { logger, LogCategory } from '../utils/Logger';

// Inline SVG-like icons using simple View components since we may not have
// dedicated SVGs for GPS / BLE mode selection yet.
import ConnectIcon from '../assets/icons/connect.svg';
import CarIcon from '../assets/icons/car.svg';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_W - spacing.lg * 2;

export const WorkflowSelectorScreen: React.FC = () => {
  const { setWorkflowMode, user } = useAppStore();

  // Entry animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim1 = useRef(new Animated.Value(40)).current;
  const slideAnim2 = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim1, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
        delay: 100,
      }),
      Animated.spring(slideAnim2, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
        delay: 250,
      }),
    ]).start();
  }, [fadeAnim, slideAnim1, slideAnim2]);

  const handleSelectGps = useCallback(() => {
    logger.info(LogCategory.APP, 'Workflow selected: GPS OBD Scan');
    setWorkflowMode('gps');
  }, [setWorkflowMode]);

  const handleSelectBle = useCallback(() => {
    logger.info(LogCategory.APP, 'Workflow selected: BLE OBD Scan');
    setWorkflowMode('ble');
  }, [setWorkflowMode]);

  const handleLogout = useCallback(() => {
    const { setUser, setIsAuthenticated, setDeviceSetupCompleted, setUserDevice, reset } = useAppStore.getState();
    logger.info(LogCategory.APP, 'User logout from workflow selector');
    reset();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary.navy} />
      {/* Header gradient */}
      <LinearGradient
        colors={[colors.primary.navy, colors.primary.navyLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>VinTraxx SmartScan</Text>
            <Text style={styles.headerSubtitle}>
              {user?.fullName ? `Welcome, ${user.fullName}` : 'Choose your scanning mode'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        <Text style={styles.sectionTitle}>Select Scan Mode</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the type of OBD device you want to connect to
        </Text>

        {/* GPS OBD Scan Card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim1 }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={handleSelectGps}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1B3A5F', '#2B5A8C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIconContainer}>
                <CarIcon width={36} height={36} color="#FFFFFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>GPS OBD Scan</Text>
                <Text style={styles.cardDescription}>
                  Connect to GPS-enabled OBD trackers. View live location, scan
                  reports, trips, and alerts remotely.
                </Text>
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* BLE OBD Scan Card */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim2 }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={handleSelectBle}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#DC2626', '#EF4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.cardIconContainer}>
                <ConnectIcon width={36} height={36} color="#FFFFFF" />
              </View>
              <View style={styles.cardTextContainer}>
                <Text style={styles.cardTitle}>BLE OBD Scan</Text>
                <Text style={styles.cardDescription}>
                  Connect via Bluetooth to a nearby OBD-II scanner. Run
                  diagnostics, build reports, and appraise vehicles.
                </Text>
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Logout */}
      <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerGradient: {
    paddingBottom: spacing.xl,
  },
  headerSafe: {
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    paddingTop: spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cardArrowText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  footerSafe: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15,
    color: colors.text.muted,
    fontWeight: '600',
  },
});
