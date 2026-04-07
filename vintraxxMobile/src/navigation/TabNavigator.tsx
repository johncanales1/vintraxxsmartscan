// Tab Navigator for VinTraxx SmartScan
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectScreen } from '../screens/ConnectScreen';
import { ScanScreen } from '../screens/ScanScreen';
import { AppraisalTabScreen } from '../screens/AppraisalTabScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { useAppStore } from '../store/appStore';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { TabParamList } from './types';

// Import SVG icons
import ConnectIcon from '../assets/icons/connect.svg';
import ScanIcon from '../assets/icons/scan.svg';
import WalletIcon from '../assets/icons/wallet.svg';
import HistoryIcon from '../assets/icons/history.svg';
import CalendarIcon from '../assets/icons/calendar.svg';

const Tab = createBottomTabNavigator<TabParamList>();

// Tab order in navigator: Connect(0), Scan(1), AppraisalTab(2), History(3), Schedule(4)
// Row 1 (top):    History(3), Schedule(4)
// Row 2 (bottom): Connect(0), Scan(1), Appraisal(2)
const ROW1_INDICES = [3, 4];
const ROW2_INDICES = [0, 1, 2];

const TAB_ACTIVE_COLOR = colors.primary.navy;       // #1E3A5F
const TAB_INACTIVE_COLOR = '#94A3B8';               // slate-400
const TAB_ACTIVE_BG = colors.primary.navy + '18';   // subtle pill

interface SvgIcon {
  width: number;
  height: number;
  color: string;
}

const TAB_META: Record<string, { label: string; Icon: React.FC<SvgIcon> }> = {
  Connect:     { label: 'Connect',   Icon: ConnectIcon },
  Scan:        { label: 'Scan',      Icon: ScanIcon },
  AppraisalTab:{ label: 'Appraisal', Icon: WalletIcon },
  History:     { label: 'History',   Icon: HistoryIcon },
  Schedule:    { label: 'Schedule',  Icon: CalendarIcon },
};

const TabItem: React.FC<{
  routeName: string;
  focused: boolean;
  flex?: number;
  onPress: () => void;
  onLongPress: () => void;
}> = ({ routeName, focused, flex = 1, onPress, onLongPress }) => {
  const meta = TAB_META[routeName];
  if (!meta) return null;
  const { label, Icon } = meta;
  const iconColor = focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR;
  const labelColor = focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR;

  return (
    <TouchableOpacity
      style={[styles.tabItem, { flex }]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.tabItemInner, focused && styles.tabItemInnerFocused]}>
        <Icon width={22} height={22} color={iconColor} />
        <Text style={[styles.tabLabel, { color: labelColor }, focused && styles.tabLabelFocused]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const renderRow = (indices: number[]) => (
    <View style={styles.tabRow}>
      {indices.map((tabIndex) => {
        const route = state.routes[tabIndex];
        if (!route) return null;
        const focused = state.index === tabIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as any);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            routeName={route.name}
            focused={focused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md }]}>
      <View style={styles.tabBar}>
        {/* Row 1: History · Schedule */}
        {renderRow(ROW1_INDICES)}
        <View style={styles.rowDivider} />
        {/* Row 2: Connect · Scan · Appraisal */}
        {renderRow(ROW2_INDICES)}
      </View>
    </View>
  );
};

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
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Connect"      component={ConnectScreen} />
        <Tab.Screen name="Scan"         component={ScanScreen} />
        <Tab.Screen name="AppraisalTab" component={AppraisalTabScreen} />
        <Tab.Screen name="History"      component={HistoryScreen} />
        <Tab.Screen name="Schedule"     component={ScheduleScreen} />
      </Tab.Navigator>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Dealer badge header ──────────────────────────────────────────────
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

  // ── Custom two-row tab bar ───────────────────────────────────────────
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 12,
  },
  tabBar: {
    width: '100%',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: spacing.sm,
    marginVertical: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabItemInnerFocused: {
    backgroundColor: TAB_ACTIVE_BG,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  tabLabelFocused: {
    fontWeight: '700',
    fontSize: 11,
  },
});
