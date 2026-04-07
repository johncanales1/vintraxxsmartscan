// Tab Navigator for VinTraxx SmartScan
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectScreen } from '../screens/ConnectScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { AppraisalTabScreen } from '../screens/AppraisalTabScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { TabParamList } from './types';

// Import SVG icons
import ConnectIcon from '../assets/icons/connect.svg';
import ScanIcon from '../assets/icons/scan.svg';
import WalletIcon from '../assets/icons/wallet.svg';
import HistoryIcon from '../assets/icons/history.svg';
import CalendarIcon from '../assets/icons/calendar.svg';

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

// Top bar showing Dealer/Non-Dealer badge
const DealerBadgeHeader: React.FC = () => {
  const { user } = useAppStore();
  const isDealer = user?.isDealer === true;
  return (
    <SafeAreaView edges={['top']} style={styles.dealerBadgeBar}>
      <View style={styles.dealerBadgeRow}>
        <Text style={styles.dealerBadgeAppName}>VinTraxx</Text>
        <View style={[styles.dealerBadge, isDealer ? styles.dealerBadgeDealer : styles.dealerBadgeRegular]}>
          <Text style={[styles.dealerBadgeText, isDealer ? styles.dealerBadgeTextDealer : styles.dealerBadgeTextRegular]}>
            {isDealer ? 'Dealer' : 'Non-Dealer'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      <DealerBadgeHeader />
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
        name="AppraisalTab"
        component={AppraisalTabScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={WalletIcon} label="Appraisal" />
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
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={CalendarIcon} label="Schedule" />
          ),
        }}
      />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  dealerBadgeBar: {
    backgroundColor: colors.primary.navy,
  },
  dealerBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.sm,
  },
  dealerBadgeAppName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dealerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dealerBadgeDealer: {
    backgroundColor: '#2563EB',
  },
  dealerBadgeRegular: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dealerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dealerBadgeTextDealer: {
    color: '#FFFFFF',
  },
  dealerBadgeTextRegular: {
    color: '#FFFFFF',
  },
  tabBar: {
    backgroundColor: colors.background.tab,
    borderTopWidth: 0,
    position: 'absolute',
    height: 64,
    borderRadius: 32,
    paddingBottom: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBarItem: {
    paddingTop: 1.5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    minHeight: 50,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 24,
  },
  tabIconContainerFocused: {
    backgroundColor: colors.primary.navy + '15',
  },
  tabLabel: {
    color: colors.text.muted,
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: colors.primary.navy,
    fontWeight: '700',
    fontSize: 12,
  },
});
