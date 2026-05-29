// GPS Tab Navigator — 3-tab bottom bar for the GPS workflow.
//
// Tabs: Scan (terminal list), Live Map, History (segmented sub-tabs).
// All 3 tabs are visible at once — no sliding strip needed.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Keyboard,
  KeyboardEvent,
  Platform,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GpsScanTabScreen } from '../screens/gps/GpsScanTabScreen';
import { GpsLiveMapTabScreen } from '../screens/gps/GpsLiveMapTabScreen';
import { GpsHistoryTabScreen } from '../screens/gps/GpsHistoryTabScreen';

import { navigationTheme } from '../theme/navigation';
import { GpsTabParamList } from './types';
import { WorkflowSwitchButton } from '../components/WorkflowSwitchButton';

import ScanIcon from '../assets/icons/tab-gps-scan.svg';
import MapIcon from '../assets/icons/tab-map.svg';
import HistoryIcon from '../assets/icons/tab-history.svg';

const Tab = createBottomTabNavigator<GpsTabParamList>();

interface SvgIconProps {
  width: number;
  height: number;
  color: string;
}

const GPS_TAB_META: {
  routeName: keyof GpsTabParamList;
  label: string;
  Icon: React.FC<SvgIconProps>;
}[] = [
  { routeName: 'GpsScanTab', label: 'Scan',     Icon: ScanIcon },
  { routeName: 'GpsLiveMap', label: 'Live Map',  Icon: MapIcon },
  { routeName: 'GpsHistory', label: 'History',   Icon: HistoryIcon },
];

// ── Tab item ───────────────────────────────────────────────────────────────
const GpsTabItem: React.FC<{
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

  const iconScale = focus.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
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

// ── Custom tab bar (3 items, no sliding) ───────────────────────────────────
const GpsCustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom : 8;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  if (keyboardVisible) return null;

  const tabCount = GPS_TAB_META.length;

  return (
    <View
      style={[styles.tabBarOuter, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBarPill}>
        <View style={styles.strip}>
          {GPS_TAB_META.map(({ routeName, label, Icon }, idx) => {
            const route = state.routes.find((r) => r.name === routeName);
            if (!route) return null;
            const tabIndex = state.routes.findIndex((r) => r.key === route.key);
            const focused = tabIndex === state.index;

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
              <GpsTabItem
                key={route.key}
                width={0}
                label={label}
                Icon={Icon}
                focused={focused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

// ── Navigator ──────────────────────────────────────────────────────────────
export const GpsTabNavigator: React.FC = () => {
  return (
    <View style={styles.navRoot}>
      <Tab.Navigator
        tabBar={(props) => <GpsCustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
        initialRouteName="GpsScanTab"
      >
        <Tab.Screen name="GpsScanTab" component={GpsScanTabScreen} />
        <Tab.Screen name="GpsLiveMap" component={GpsLiveMapTabScreen} />
        <Tab.Screen name="GpsHistory" component={GpsHistoryTabScreen} />
      </Tab.Navigator>
      {/* Floating "switch scan mode" pill — visible on every GPS main tab. */}
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
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: '100%',
  },
  tabItem: {
    flex: 1,
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
    minWidth: 72,
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
