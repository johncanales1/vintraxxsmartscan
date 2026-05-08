// Tab Navigator — uniform 5-tab paginating bottom bar.
//
// Five tabs in fixed order: Devices, Scan, Appraisal, Schedule, History.
// Only three are visible at once inside a viewport that clips the inner
// strip; when the active tab changes, the strip auto-slides (spring) so
// the active tab is always visible:
//
//   active 0 (Devices)   → window 0 = [Devices, Scan, Appraisal]
//   active 1 (Scan)      → window 0 = [Devices, Scan, Appraisal]
//   active 2 (Appraisal) → window 1 = [Scan, Appraisal, Schedule]
//   active 3 (Schedule)  → window 2 = [Appraisal, Schedule, History]
//   active 4 (History)   → window 2 = [Appraisal, Schedule, History]
//
// The selected tab uses a filled pill background plus a small red dot
// underneath the label. No elevated centre button, no radial fan — those
// destinations are reachable by tapping the Scan / Devices / Appraisal
// tabs directly.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Keyboard,
  KeyboardEvent,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScanScreen } from '../screens/ScanScreen';
import { AppraisalTabScreen } from '../screens/AppraisalTabScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { DevicesScreen } from '../screens/DevicesScreen';

import { useAppStore } from '../store/appStore';
import type { GpsAlarm } from '../types/gps';
import { navigationTheme } from '../theme/navigation';
import { TabParamList } from './types';

import DevicesIcon from '../assets/icons/tab-devices.svg';
import ScanIcon from '../assets/icons/tab-scan.svg';
import AppraisalIcon from '../assets/icons/tab-appraisal.svg';
import ScheduleIcon from '../assets/icons/tab-schedule.svg';
import HistoryIcon from '../assets/icons/tab-history.svg';

const Tab = createBottomTabNavigator<TabParamList>();

interface SvgIconProps {
  width: number;
  height: number;
  color: string;
}

// ── Tab metadata ───────────────────────────────────────────────────────────
//
// Order here determines visual order in the strip. It MUST match the order
// of `<Tab.Screen>` declarations below so `state.index` lines up with the
// strip indices.

const TAB_META: {
  routeName: keyof TabParamList;
  label: string;
  Icon: React.FC<SvgIconProps>;
}[] = [
  { routeName: 'Devices',      label: 'Devices',   Icon: DevicesIcon },
  { routeName: 'Scan',         label: 'Scan',      Icon: ScanIcon },
  { routeName: 'AppraisalTab', label: 'Appraisal', Icon: AppraisalIcon },
  { routeName: 'Schedule',     label: 'Schedule',  Icon: ScheduleIcon },
  { routeName: 'History',      label: 'History',   Icon: HistoryIcon },
];

// ── Tab item ───────────────────────────────────────────────────────────────

const TabItem: React.FC<{
  width: number;
  label: string;
  Icon: React.FC<SvgIconProps>;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  badge?: number;
}> = ({ width, label, Icon, focused, onPress, onLongPress, badge }) => {
  const focus = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(focus, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 18,
    }).start();
  }, [focused, focus]);

  const iconScale = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const dotScale = focus.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const dotOpacity = focus;

  const labelColor = focused
    ? navigationTheme.tabItem.labelColorFocused
    : navigationTheme.tabItem.labelColorRest;
  const iconColor = focused
    ? navigationTheme.tabItem.iconColorFocused
    : navigationTheme.tabItem.iconColorRest;
  const iconSize = focused
    ? navigationTheme.tabItem.iconSizeFocused
    : navigationTheme.tabItem.iconSizeRest;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: true }}
      hitSlop={{
        top: navigationTheme.tabItem.hitSlop,
        bottom: navigationTheme.tabItem.hitSlop,
        left: navigationTheme.tabItem.hitSlop,
        right: navigationTheme.tabItem.hitSlop,
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={[styles.tabItem, { width }]}
    >
      <View style={[styles.tabItemInner, focused && styles.tabItemInnerFocused]}>
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Icon width={iconSize} height={iconSize} color={iconColor} />
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
            </View>
          )}
        </Animated.View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: labelColor,
              fontSize: focused
                ? navigationTheme.tabItem.labelSizeFocused
                : navigationTheme.tabItem.labelSizeRest,
              fontWeight: focused
                ? navigationTheme.tabItem.labelWeightFocused
                : navigationTheme.tabItem.labelWeightRest,
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {label}
        </Text>
        <Animated.View
          style={[
            styles.dot,
            {
              opacity: dotOpacity,
              transform: [{ scale: dotScale }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
};

// ── Custom tab bar ─────────────────────────────────────────────────────────

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom : 8;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [viewportW, setViewportW] = useState(0);

  // iOS pushes the tab bar over the keyboard unless we hide it. Android's
  // soft-input adjust handles it for us.
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const onShow = (_e: KeyboardEvent) => setKeyboardVisible(true);
    const onHide = () => setKeyboardVisible(false);
    const showSub = Keyboard.addListener('keyboardWillShow', onShow);
    const hideSub = Keyboard.addListener('keyboardWillHide', onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const { gpsAlarms } = useAppStore();
  // Explicit GpsAlarm annotation sidesteps the store's implicit-any
  // inference and keeps this file clean of TS7006 cascades.
  const unreadAlarms = (gpsAlarms as GpsAlarm[]).filter(
    (a: GpsAlarm) => !a.acknowledged && !a.closedAt,
  ).length;
  const criticalAlarms = (gpsAlarms as GpsAlarm[]).filter(
    (a: GpsAlarm) => !a.acknowledged && !a.closedAt && a.severity === 'CRITICAL',
  ).length;

  // Map the active tab to a strip offset (0, 1, or 2). When the active
  // index is at either edge the offset clamps so we never reveal empty
  // space past the strip.
  const activeIndex = state.index;
  const totalCount = navigationTheme.tabBar.totalCount;
  const windowCount = navigationTheme.tabBar.windowCount;
  const maxOffset = totalCount - windowCount; // = 2

  const offsetIndex = useMemo(() => {
    if (activeIndex <= 0) return 0;
    if (activeIndex >= totalCount - 1) return maxOffset;
    // Try to centre the active tab in the window: offset = activeIndex - 1.
    return Math.max(0, Math.min(maxOffset, activeIndex - 1));
  }, [activeIndex, totalCount, maxOffset]);

  // Per-tab width is derived from the measured viewport width once layout
  // resolves. Until then we render a 0-width strip (invisible) so we don't
  // briefly flash the wrong layout.
  const tabWidth = viewportW > 0 ? viewportW / windowCount : 0;
  const stripWidth = tabWidth * totalCount;

  const translateX = useRef(new Animated.Value(0)).current;
  const targetX = -offsetIndex * tabWidth;

  useEffect(() => {
    if (viewportW <= 0) return;
    Animated.spring(translateX, {
      toValue: targetX,
      useNativeDriver: true,
      tension: navigationTheme.tabBar.slideSpring.tension,
      friction: navigationTheme.tabBar.slideSpring.friction,
    }).start();
  }, [targetX, viewportW, translateX]);

  const onViewportLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== viewportW) setViewportW(w);
  };

  if (keyboardVisible) return null;

  // Build the 5 tab entries in declared order. We index into `state.routes`
  // by route name so re-ordering stays robust if `<Tab.Screen>` declarations
  // ever drift from TAB_META.
  type RouteT = typeof state.routes[number];
  const routeByName: Map<keyof TabParamList, RouteT> = new Map(
    state.routes.map((r): [keyof TabParamList, RouteT] => [r.name as keyof TabParamList, r]),
  );

  return (
    <View
      style={[styles.tabBarOuter, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBarPill}>
        <View style={styles.viewport} onLayout={onViewportLayout}>
          <Animated.View
            style={[
              styles.strip,
              {
                width: stripWidth || '100%',
                transform: [{ translateX }],
              },
            ]}
          >
            {TAB_META.map(({ routeName, label, Icon }) => {
              const route = routeByName.get(routeName);
              if (!route) return null;
              const tabIndex = state.routes.findIndex((r) => r.key === route.key);
              const focused = tabIndex === activeIndex;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  (navigation as any).navigate(route.name);
                }
              };
              const onLongPress = () => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              };

              let badge: number | undefined;
              if (routeName === 'Devices') badge = criticalAlarms || undefined;
              if (routeName === 'History') badge = unreadAlarms || undefined;

              return (
                <TabItem
                  key={route.key}
                  width={tabWidth}
                  label={label}
                  Icon={Icon}
                  focused={focused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  badge={badge}
                />
              );
            })}
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

// ── Navigator ──────────────────────────────────────────────────────────────
//
// Screen order MUST match TAB_META. React Navigation's `state.index` reflects
// the declaration order, and the slide animation uses that index directly.

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Devices"
    >
      <Tab.Screen name="Devices"      component={DevicesScreen} />
      <Tab.Screen name="Scan"         component={ScanScreen} />
      <Tab.Screen name="AppraisalTab" component={AppraisalTabScreen} />
      <Tab.Screen name="Schedule"     component={ScheduleScreen} />
      <Tab.Screen name="History"      component={HistoryScreen} />
    </Tab.Navigator>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarOuter: {
    position: 'absolute',
    left: navigationTheme.tabBar.horizontalInset,
    right: navigationTheme.tabBar.horizontalInset,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBarPill: {
    backgroundColor: navigationTheme.tabBar.bg,
    borderRadius: navigationTheme.tabBar.borderRadius,
    height: navigationTheme.tabBar.height,
    width: '100%',
    borderWidth: 1,
    borderColor: navigationTheme.tabBar.border,
    shadowColor: navigationTheme.tabBar.shadowColor,
    shadowOpacity: navigationTheme.tabBar.shadowOpacity,
    shadowRadius: navigationTheme.tabBar.shadowRadius,
    shadowOffset: { width: 0, height: navigationTheme.tabBar.shadowOffsetY },
    elevation: navigationTheme.tabBar.elevation,
    paddingHorizontal: navigationTheme.tabBar.innerPadH,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  viewport: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  tabItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: navigationTheme.tabItem.pillPadV,
    paddingHorizontal: navigationTheme.tabItem.pillPadH,
    borderRadius: navigationTheme.tabItem.pillRadius,
    minWidth: 64,
  },
  tabItemInnerFocused: {
    backgroundColor: navigationTheme.tabItem.pillBg,
  },
  tabLabel: {
    marginTop: 2,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  dot: {
    marginTop: navigationTheme.tabItem.dotMarginTop,
    width: navigationTheme.tabItem.dotSize,
    height: navigationTheme.tabItem.dotSize,
    borderRadius: navigationTheme.tabItem.dotSize / 2,
    backgroundColor: navigationTheme.tabItem.dotColor,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
