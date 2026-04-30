// Tab Navigator (Option B) — white pill bar with elevated red Scan button.
//
// Layout: [ Devices | History | (centre) | Appraisal | Schedule ].
// The centre slot is reserved for an elevated circular Scan button that
// short-presses into a smart-default route and long-presses into a radial
// fan with three sub-actions (Bluetooth scan / Go live / New appraisal).
//
// Smart default for short-press:
//   • If user has a paired GPS terminal currently ONLINE       → LiveTrack
//   • Else if a BLE OBD device was previously paired           → Scan
//   • Else                                                      → Devices
//
// `DealerBadgeHeader` from the previous design is removed; the dealer pill
// now lives inside the Devices tab header (DevicesScreen).

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  Keyboard,
  KeyboardEvent,
  Platform,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ScanScreen } from '../screens/ScanScreen';
import { AppraisalTabScreen } from '../screens/AppraisalTabScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { DevicesScreen } from '../screens/DevicesScreen';

import { useAppStore } from '../store/appStore';
import { navigationTheme } from '../theme/navigation';
import { TabParamList, RootStackParamList } from './types';

import ConnectIcon from '../assets/icons/connect.svg';
import ScanIcon from '../assets/icons/scan.svg';
import WalletIcon from '../assets/icons/wallet.svg';
import HistoryIcon from '../assets/icons/history.svg';
import CalendarIcon from '../assets/icons/calendar.svg';

const Tab = createBottomTabNavigator<TabParamList>();

interface SvgIconProps {
  width: number;
  height: number;
  color: string;
}

const TAB_META: Record<
  Exclude<keyof TabParamList, 'Scan'>,
  { label: string; Icon: React.FC<SvgIconProps> }
> = {
  Devices:      { label: 'Devices',   Icon: ConnectIcon },
  History:      { label: 'History',   Icon: HistoryIcon },
  AppraisalTab: { label: 'Appraisal', Icon: WalletIcon },
  Schedule:     { label: 'Schedule',  Icon: CalendarIcon },
};

// ── Side tab item ──────────────────────────────────────────────────────────

const TabItem: React.FC<{
  routeName: keyof TabParamList;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  badge?: number;
}> = ({ routeName, focused, onPress, onLongPress, badge }) => {
  const meta = TAB_META[routeName as Exclude<keyof TabParamList, 'Scan'>];
  if (!meta) return null;
  const { label, Icon } = meta;

  const scale = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 200,
      friction: 18,
    }).start();
  }, [focused, scale]);

  const iconScale = scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

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
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      hitSlop={{
        top: navigationTheme.tabItem.hitSlop,
        bottom: navigationTheme.tabItem.hitSlop,
        left: navigationTheme.tabItem.hitSlop,
        right: navigationTheme.tabItem.hitSlop,
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
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
      </View>
    </TouchableOpacity>
  );
};

// ── Elevated centre Scan button + radial fan ───────────────────────────────

const RadialFanItem: React.FC<{
  /** 0..n-1; controls staggered enter delay and arc angle. */
  index: number;
  total: number;
  Icon: React.FC<SvgIconProps>;
  caption: string;
  disabled?: boolean;
  onPress: () => void;
  expanded: boolean;
}> = ({ index, total, Icon, caption, disabled, onPress, expanded }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: 220,
      delay: expanded ? index * navigationTheme.radial.staggerMs : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, index, progress]);

  // Compute (dx, dy) along an arc centered straight up (-90°).
  const arcDeg = navigationTheme.radial.arcDegrees;
  const r = navigationTheme.radial.spacing;
  const startDeg = -90 - arcDeg / 2;
  const stepDeg = total > 1 ? arcDeg / (total - 1) : 0;
  const angleDeg = startDeg + stepDeg * index;
  const angleRad = (angleDeg * Math.PI) / 180;
  const dx = Math.cos(angleRad) * r;
  const dy = Math.sin(angleRad) * r;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <Animated.View
      pointerEvents={expanded ? 'auto' : 'none'}
      style={[
        styles.radialChip,
        {
          width: navigationTheme.radial.chipSize,
          height: navigationTheme.radial.chipSize,
          borderRadius: navigationTheme.radial.chipSize / 2,
          backgroundColor: disabled
            ? navigationTheme.radial.bgDisabled
            : navigationTheme.radial.bg,
          opacity: progress,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (!disabled) onPress();
        }}
        style={styles.radialChipInner}
        accessibilityRole="button"
        accessibilityLabel={caption}
        accessibilityState={{ disabled: !!disabled }}
      >
        <Icon
          width={navigationTheme.radial.iconSize}
          height={navigationTheme.radial.iconSize}
          color={navigationTheme.radial.iconColor}
        />
      </Pressable>
    </Animated.View>
  );
};

const PrimaryCenterButton: React.FC<{
  onPrimary: () => void;
  onSecondary: (kind: 'ble-scan' | 'go-live' | 'appraisal') => void;
  hasOnlineGps: boolean;
}> = ({ onPrimary, onSecondary, hasOnlineGps }) => {
  const [expanded, setExpanded] = useState(false);
  const press = useRef(new Animated.Value(0)).current;

  const onPressIn = () => {
    Animated.timing(press, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(press, {
      toValue: 0,
      useNativeDriver: true,
      tension: 200,
      friction: 14,
    }).start();
  };

  const buttonScale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });

  return (
    <View style={styles.primaryWrap} pointerEvents="box-none">
      {/* Radial backdrop — taps outside collapse the fan. */}
      {expanded && (
        <Pressable
          style={styles.radialBackdrop}
          onPress={() => setExpanded(false)}
          accessibilityElementsHidden
        />
      )}

      {/* Radial fan — three sub-actions. */}
      <View style={styles.radialAnchor} pointerEvents="box-none">
        <RadialFanItem
          index={0}
          total={3}
          expanded={expanded}
          Icon={ConnectIcon}
          caption="Bluetooth scan"
          onPress={() => {
            setExpanded(false);
            onSecondary('ble-scan');
          }}
        />
        <RadialFanItem
          index={1}
          total={3}
          expanded={expanded}
          Icon={ScanIcon}
          caption="Go live"
          disabled={!hasOnlineGps}
          onPress={() => {
            setExpanded(false);
            onSecondary('go-live');
          }}
        />
        <RadialFanItem
          index={2}
          total={3}
          expanded={expanded}
          Icon={WalletIcon}
          caption="New appraisal"
          onPress={() => {
            setExpanded(false);
            onSecondary('appraisal');
          }}
        />
      </View>

      <Animated.View
        style={[
          styles.primaryButton,
          { transform: [{ scale: buttonScale }] },
        ]}
      >
        <Pressable
          onPress={() => {
            if (expanded) {
              setExpanded(false);
              return;
            }
            onPrimary();
          }}
          onLongPress={() => setExpanded(true)}
          delayLongPress={300}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.primaryButtonInner}
          accessibilityRole="button"
          accessibilityLabel="Primary action"
          accessibilityHint="Double tap to scan. Hold for more options."
        >
          <ScanIcon
            width={navigationTheme.primary.iconSize}
            height={navigationTheme.primary.iconSize}
            color={navigationTheme.primary.iconColor}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};

// ── Custom tab bar ─────────────────────────────────────────────────────────

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom : 8;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  const {
    gpsTerminals,
    gpsAlarms,
    selectedTerminalId,
    userDevice,
    setLastPrimaryAction,
  } = useAppStore();

  const rootNav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Smart-default helpers — center button & radial fan share these so the
  // copy stays consistent.
  const onlineTerminals = gpsTerminals.filter((t) => t.status === 'ONLINE');
  const liveTarget =
    onlineTerminals.find((t) => t.id === selectedTerminalId) ?? onlineTerminals[0];
  const hasOnlineGps = !!liveTarget;
  const hasBleScanner = !!userDevice?.macAddress;

  const goPrimary = () => {
    if (liveTarget) {
      setLastPrimaryAction('go-live');
      rootNav.navigate('LiveTrack', { terminalId: liveTarget.id });
      return;
    }
    if (hasBleScanner) {
      setLastPrimaryAction('ble-scan');
      // React Navigation's typed `navigate(name, params)` overload is
      // strict; cast through `any` so the (name, params) tuple resolves.
      (navigation as any).navigate('Scan', { autoStart: true });
      return;
    }
    (navigation as any).navigate('Devices');
  };

  const goSecondary = (kind: 'ble-scan' | 'go-live' | 'appraisal') => {
    setLastPrimaryAction(kind);
    if (kind === 'ble-scan') {
      (navigation as any).navigate('Scan', { autoStart: true });
      return;
    }
    if (kind === 'go-live') {
      if (liveTarget) rootNav.navigate('LiveTrack', { terminalId: liveTarget.id });
      else (navigation as any).navigate('Devices', { segment: 'gps' });
      return;
    }
    rootNav.navigate('Appraiser');
  };

  const unreadAlarms = gpsAlarms.filter((a) => !a.acknowledged && !a.closedAt).length;
  const criticalAlarms = gpsAlarms.filter(
    (a) => !a.acknowledged && !a.closedAt && a.severity === 'CRITICAL',
  ).length;

  if (keyboardVisible) return null;

  return (
    <View
      style={[styles.tabBarOuter, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBarPill}>
        {state.routes.map((route, tabIndex) => {
          const focused = state.index === tabIndex;

          // The centre slot is owned by the elevated button — render an
          // empty spacer so the side icons keep their even spacing.
          if (route.name === 'Scan') {
            return <View key={route.key} style={styles.tabItem} />;
          }

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

          // Badges: Devices shows critical alarm count; History shows unread
          // alarm count (general). UX rationale: critical is the urgent
          // signal; History counts everything new.
          let badge: number | undefined;
          if (route.name === 'Devices') badge = criticalAlarms || undefined;
          if (route.name === 'History') badge = unreadAlarms || undefined;

          return (
            <TabItem
              key={route.key}
              routeName={route.name as keyof TabParamList}
              focused={focused}
              onPress={onPress}
              onLongPress={onLongPress}
              badge={badge}
            />
          );
        })}
      </View>

      {/* Elevated centre Scan button overlays the bar's middle slot. */}
      <PrimaryCenterButton
        onPrimary={goPrimary}
        onSecondary={goSecondary}
        hasOnlineGps={hasOnlineGps}
      />
    </View>
  );
};

// ── Navigator ──────────────────────────────────────────────────────────────

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Devices"
    >
      <Tab.Screen name="Devices"      component={DevicesScreen} />
      <Tab.Screen name="History"      component={HistoryScreen} />
      {/* Scan is in the tab list so the centre slot has a target route, but
          it's never rendered as a normal tab — the elevated button drives
          navigation directly. */}
      <Tab.Screen name="Scan"         component={ScanScreen} />
      <Tab.Screen name="AppraisalTab" component={AppraisalTabScreen} />
      <Tab.Screen name="Schedule"     component={ScheduleScreen} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
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
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: navigationTheme.tabItem.pillPadV,
    paddingHorizontal: navigationTheme.tabItem.pillPadH,
    borderRadius: navigationTheme.tabItem.pillRadius,
  },
  tabItemInnerFocused: {
    backgroundColor: navigationTheme.tabItem.pillBg,
  },
  tabLabel: {
    marginTop: 2,
    letterSpacing: 0.3,
    textAlign: 'center',
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

  // ── Centre raised button ─────────────────────────────────────────────
  primaryWrap: {
    position: 'absolute',
    top: -navigationTheme.primary.raiseOffset,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  primaryButton: {
    width: navigationTheme.primary.size,
    height: navigationTheme.primary.size,
    borderRadius: navigationTheme.primary.size / 2,
    backgroundColor: navigationTheme.primary.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: navigationTheme.primary.ringWidth,
    borderColor: navigationTheme.primary.ringColor,
    shadowColor: navigationTheme.primary.shadowColor,
    shadowOpacity: navigationTheme.primary.shadowOpacity,
    shadowRadius: navigationTheme.primary.shadowRadius,
    shadowOffset: { width: 0, height: navigationTheme.primary.shadowOffsetY },
    elevation: navigationTheme.primary.elevation,
  },
  primaryButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialAnchor: {
    position: 'absolute',
    top: navigationTheme.primary.size / 2 - navigationTheme.radial.chipSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialChip: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  radialChipInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialBackdrop: {
    position: 'absolute',
    top: -800,
    left: -2000,
    right: -2000,
    bottom: -200,
  },
});
