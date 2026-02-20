// Tab Navigator for VinTraxx SmartScan
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ConnectScreen } from '../screens/ConnectScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { TabParamList } from './types';

// Import SVG icons
import ConnectIcon from '../assets/icons/connect.svg';
import ScanIcon from '../assets/icons/scan.svg';
import HistoryIcon from '../assets/icons/history.svg';

const Tab = createBottomTabNavigator<TabParamList>();

interface TabIconProps {
  focused: boolean;
  Icon: React.FC<{ width: number; height: number; color: string }>;
  label: string;
}

const TabIcon: React.FC<TabIconProps> = ({ focused, Icon, label }) => (
  <View style={[styles.tabIconContainer, focused && styles.tabIconContainerFocused]}>
    <Icon 
      width={24} 
      height={24} 
      color={focused ? colors.primary.navy : colors.text.muted} 
    />
    <Text 
      style={[styles.tabLabel, focused && styles.tabLabelFocused]}
      numberOfLines={1}
    >
      {label}
    </Text>
  </View>
);

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary.red,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Connect"
        component={ConnectScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={ConnectIcon} label="Connect" />
          ),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={ScanIcon} label="Scan" />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={HistoryIcon} label="History" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background.tab,
    borderTopWidth: 1,
    position: 'absolute',
    borderTopColor: colors.border.light,
    height: 60,
    borderRadius: 40,
    paddingBottom: spacing.md,
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  tabBarItem: {
    paddingTop: 1.5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    minHeight: 50,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 24,
  },
  tabIconContainerFocused: {
    backgroundColor: colors.primary.navy + '15', // Navy with 15% opacity
  },
  tabLabel: {
    color: colors.text.muted,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: colors.primary.navy,
    fontWeight: '600',
  },
});
