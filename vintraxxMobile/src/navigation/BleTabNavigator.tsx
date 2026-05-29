// BLE Tab Navigator — 5-tab bottom bar for the BLE workflow.
//
// Identical styling to the original TabNavigator but:
//   • Uses BleTabParamList (no GPS segment param)
//   • No GPS alarm badges on any tab
//   • DevicesScreen is BLE-only (no GPS segment)

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
import { ConnectScreen } from '../screens/ConnectScreen';

import { navigationTheme } from '../theme/navigation';
import { BleTabParamList } from './types';
import { WorkflowSwitchButton } from '../components/WorkflowSwitchButton';

import DevicesIcon from '../assets/icons/tab-devices.svg';
import ScanIcon from '../assets/icons/tab-scan.svg';
import AppraisalIcon from '../assets/icons/tab-appraisal.svg';
import ScheduleIcon from '../assets/icons/tab-schedule.svg';
import HistoryIcon from '../assets/icons/tab-history.svg';

const Tab = createBottomTabNavigator<BleTabParamList>();

interface SvgIconProps {
  width: number;
  height: number;
  color: string;
}

// ── Tab metadata ───────────────────────────────────────────────────────────
const TAB_META: {
  routeName: keyof BleTabParamList;
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
}> = ({ width, label, Icon, focused, onPress, onLongPress }) => {
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
const BleCustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom : 8;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [viewportW, setViewportW] = useState(0);

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

  const activeIndex = state.index;
  const totalCount = navigationTheme.tabBar.totalCount;
  const windowCount = navigationTheme.tabBar.windowCount;
  const maxOffset = totalCount - windowCount;

  const offsetIndex = useMemo(() => {
    if (activeIndex <= 0) return 0;
    if (activeIndex >= totalCount - 1) return maxOffset;
    return Math.max(0, Math.min(maxOffset, activeIndex - 1));
  }, [activeIndex, totalCount, maxOffset]);

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

  type RouteT = typeof state.routes[number];
  const routeByName: Map<keyof BleTabParamList, RouteT> = new Map(
    state.routes.map((r): [keyof BleTabParamList, RouteT] => [r.name as keyof BleTabParamList, r]),
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

              return (
                <TabItem
                  key={route.key}
                  width={tabWidth}
                  label={label}
                  Icon={Icon}
                  focused={focused}
                  onPress={onPress}
                  onLongPress={onLongPress}
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
// Wrap ConnectScreen in a thin component so it renders correctly as BLE-only.
const BleDevicesScreen: React.FC<{ navigation?: any; route?: any }> = ({ navigation, route }) => {
  return (
    <ConnectScreen
      navigation={navigation}
      route={{ params: { autoConnect: route?.params?.autoConnect, autoScan: route?.params?.autoScan } }}
    />
  );
};

export const BleTabNavigator: React.FC = () => {
  return (
    <View style={styles.navRoot}>
      <Tab.Navigator
        tabBar={(props) => <BleCustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
        initialRouteName="Devices"
      >
        <Tab.Screen name="Devices"      component={BleDevicesScreen} />
        <Tab.Screen name="Scan"         component={ScanScreen} />
        <Tab.Screen name="AppraisalTab" component={AppraisalTabScreen} />
        <Tab.Screen name="Schedule"     component={ScheduleScreen} />
        <Tab.Screen name="History"      component={HistoryScreen} />
      </Tab.Navigator>
      {/* Floating "switch scan mode" pill — visible on every BLE main tab. */}
      <WorkflowSwitchButton />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  navRoot: {
    flex: 1,
  },
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
});
