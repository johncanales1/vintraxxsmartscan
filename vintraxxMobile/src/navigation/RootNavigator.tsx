// Root Navigator for VinTraxx SmartScan
// Uses conditional screen rendering based on reactive auth state (React Navigation best practice)
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createNavigationContainerRef } from '@react-navigation/native';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { DeviceSetupScreen } from '../screens/DeviceSetupScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { FullReportScreen } from '../screens/FullReportScreen';
import { AppraiserScreen } from '../screens/AppraiserScreen';
import { VinScannerScreen } from '../screens/VinScannerScreen';
import { LiveTrackScreen } from '../screens/LiveTrackScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { AlertDetailScreen } from '../screens/AlertDetailScreen';
import { TripsScreen } from '../screens/TripsScreen';
import { TripDetailScreen } from '../screens/TripDetailScreen';
import { DtcEventsScreen } from '../screens/DtcEventsScreen';
import { DtcEventDetailScreen } from '../screens/DtcEventDetailScreen';
import { DeviceSettingsScreen } from '../screens/DeviceSettingsScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { RootStackParamList } from './types';
import { authService } from '../services/auth/AuthService';
import { useAppStore } from '../store/appStore';
import { logger, LogCategory } from '../utils/Logger';
import { debugLogger } from '../services/debug/DebugLogger';
import { gpsWs } from '../services/gps/GpsWsClient';
import { pushService } from '../services/push/PushService';

/**
 * Module-scoped navigation ref. Push notifications and FCM cold-starts need
 * to navigate from outside React (e.g. when a tap occurs while the app is
 * suspended). Anything that needs imperative navigation can import this ref
 * and call `.navigate(...)` on it.
 */
export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { 
    isAuthenticated,
    isAuthLoading,
    deviceSetupCompleted,
    setUser, 
    setIsAuthenticated, 
    setIsAuthLoading,
    setUserDevice, 
    setDeviceSetupCompleted,
  } = useAppStore();

  useEffect(() => {
    // Initialize auth state on app start
    // ALWAYS require login on launch - clear any stored auth
    const initAuth = () => {
      try {
        debugLogger.logEvent('Auth init: Starting (always require login mode)');
        
        // Clear any stored authentication to force login on every launch
        authService.clearAuthOnLaunch();
        
        // Ensure clean state - user must login
        logger.info(LogCategory.APP, 'Auth cleared on launch, showing login screen');
        debugLogger.logEvent('Auth init: Cleared stored auth, requiring login');
        setUser(null);
        setIsAuthenticated(false);
        setDeviceSetupCompleted(false);
        setUserDevice(null);
      } catch (error) {
        logger.error(LogCategory.APP, 'Auth initialization error', error);
        debugLogger.logError('Auth init: Error during initialization', error);
        // On error, default to unauthenticated state
        setUser(null);
        setIsAuthenticated(false);
        setDeviceSetupCompleted(false);
      } finally {
        setIsAuthLoading(false);
        debugLogger.logEvent('Auth init: Complete');
      }
    };

    initAuth();
  }, [setUser, setIsAuthenticated, setIsAuthLoading, setUserDevice, setDeviceSetupCompleted]);

  // ── Live infra lifecycle ──────────────────────────────────────────────
  // When the user is authenticated, open the GPS WebSocket and register
  // the FCM/APNs token. On logout, tear both down and unregister the token.
  // We watch `isAuthenticated` so token-refresh-driven re-logins also rebind.
  useEffect(() => {
    if (!isAuthenticated) {
      gpsWs.disconnect();
      void pushService.unregisterCurrent();
      return;
    }
    gpsWs.connect();
    // Push init is async but fire-and-forget — failures inside the service
    // are logged + swallowed so the UI is never blocked.
    void pushService.initialise();

    // Deep-link handler: when a CRITICAL alarm push is tapped, hop into
    // AlertDetail if the navigator is ready. We cast to `any` because the
    // generic on `createNavigationContainerRef<RootStackParamList>()` does
    // not narrow the (name, params) overload chain — TS rejects two `never`
    // casts. `any` keeps this single hop simple without polluting the rest
    // of the file.
    const offDeepLink = pushService.onDeepLink((alarmId) => {
      if (rootNavigationRef.isReady()) {
        (rootNavigationRef as any).navigate('AlertDetail', { alarmId });
      }
    });
    return () => {
      offDeepLink();
    };
  }, [isAuthenticated]);

  // Show loading screen while checking stored auth
  if (isAuthLoading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={colors.primary.navy} />
        <Text style={loadingStyles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary.navy,
        },
        headerTintColor: colors.text.inverse,
        headerTitleStyle: {
          fontWeight: typography.fontWeight.semiBold,
        },
      }}
    >
      {!isAuthenticated ? (
        // Auth screens - shown when user is NOT authenticated
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : !deviceSetupCompleted ? (
        // Device setup - shown after login but before device is set up
        <Stack.Screen
          name="DeviceSetup"
          component={DeviceSetupScreen}
          options={{ 
            headerShown: true,
            title: 'Device Setup',
            headerBackVisible: false,
          }}
        />
      ) : (
        // Main app screens - shown when authenticated AND device is set up
        <>
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Report"
            component={ReportScreen}
            options={{
              title: 'Condition Report',
              headerShown: true,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="FullReport"
            component={FullReportScreen}
            options={{
              title: 'Full Report',
              headerShown: true,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="Appraiser"
            component={AppraiserScreen}
            options={{
              title: 'Trade-In Appraisal',
              headerShown: false,
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="VinScanner"
            component={VinScannerScreen}
            options={{
              title: 'Scan VIN',
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />

          {/* ── Phase 5: GPS / Live tracking ─────────────────────────── */}
          <Stack.Screen
            name="LiveTrack"
            component={LiveTrackScreen}
            options={{ headerShown: false, presentation: 'card' }}
          />
          <Stack.Screen
            name="DeviceSettings"
            component={DeviceSettingsScreen}
            options={{ headerShown: true, title: 'Device settings' }}
          />
          <Stack.Screen
            name="Alerts"
            component={AlertsScreen}
            options={{ headerShown: true, title: 'Alerts' }}
          />
          <Stack.Screen
            name="AlertDetail"
            component={AlertDetailScreen}
            options={{ headerShown: true, title: 'Alert' }}
          />
          <Stack.Screen
            name="Trips"
            component={TripsScreen}
            options={{ headerShown: true, title: 'Trips' }}
          />
          <Stack.Screen
            name="TripDetail"
            component={TripDetailScreen}
            options={{ headerShown: true, title: 'Trip' }}
          />
          <Stack.Screen
            name="DtcEvents"
            component={DtcEventsScreen}
            options={{ headerShown: true, title: 'GPS DTC events' }}
          />
          <Stack.Screen
            name="DtcEventDetail"
            component={DtcEventDetailScreen}
            options={{ headerShown: true, title: 'DTC event' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
});
