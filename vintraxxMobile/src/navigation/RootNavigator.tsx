// Root Navigator for VinTraxx SmartScan
// Uses conditional screen rendering based on reactive auth state (React Navigation best practice)
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { DeviceSetupScreen } from '../screens/DeviceSetupScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { CleanReportScreen } from '../screens/CleanReportScreen';
import { FullReportScreen } from '../screens/FullReportScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { RootStackParamList } from './types';
import { authService } from '../services/auth/AuthService';
import { useAppStore } from '../store/appStore';
import { logger, LogCategory } from '../utils/Logger';
import { debugLogger } from '../services/debug/DebugLogger';

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
            name="CleanReport"
            component={CleanReportScreen}
            options={{
              title: 'Clean Report',
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
