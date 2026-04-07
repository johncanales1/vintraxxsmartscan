// Tab Navigator for VinTraxx SmartScan
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
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

const TAB_ACTIVE_COLOR = '#FFFFFF';
const TAB_INACTIVE_COLOR = 'rgba(255,255,255,0.55)';
const TAB_BAR_BG = colors.primary.navy;
const TAB_ACTIVE_PILL = 'rgba(255,255,255,0.18)';

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
  onPress: () => void;
  onLongPress: () => void;
}> = ({ routeName, focused, onPress, onLongPress }) => {
  const meta = TAB_META[routeName];
  if (!meta) return null;
  const { label, Icon } = meta;
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 15,
    }).start();
  }, [focused, scaleAnim]);

  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.tabItemInner, focused && styles.tabItemInnerFocused]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Icon width={20} height={20} color={focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR} />
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            { color: focused ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR },
            focused && styles.tabLabelFocused,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <View
      style={[
        styles.tabBarOuter,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <View style={styles.tabBarPill}>
        {state.routes.map((route, tabIndex) => {
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

  // ── Floating pill tab bar ─────────────────────────────────────────────
  tabBarOuter: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: TAB_BAR_BG,
    borderRadius: 28,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    paddingHorizontal: 6,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  tabItemInnerFocused: {
    backgroundColor: TAB_ACTIVE_PILL,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabLabelFocused: {
    fontWeight: '800',
    fontSize: 9.5,
  },
});
