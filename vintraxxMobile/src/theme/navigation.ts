// Tab-bar layout tokens (Option B per the integration plan).
//
// All sizes/colors here are co-located so a designer can tweak the bar in
// one place. Numbers are exact values from the spec — keep them aligned.

import { colors } from './colors';

export const navigationTheme = {
  tabBar: {
    height: 76,
    horizontalInset: 12,
    borderRadius: 28,
    bg: '#FFFFFF',
    bgDark: '#0F172A',
    border: 'rgba(17,24,39,0.06)',
    shadowColor: '#000000',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffsetY: 8,
    elevation: 16,
    /** Number of tabs visible at once inside the pill viewport. */
    windowCount: 3,
    /** Total tabs (Devices, Scan, Appraisal, Schedule, History). */
    totalCount: 5,
    /** Spring used to slide the inner strip when the active tab changes. */
    slideSpring: { tension: 120, friction: 14 },
    /** Inner padding so tab pills don't touch the rounded pill edges. */
    innerPadH: 6,
  },
  tabItem: {
    iconSizeRest: 22,
    iconSizeFocused: 24,
    iconColorRest: '#6B7280',
    iconColorFocused: colors.primary.navy,
    labelSizeRest: 13,
    labelSizeFocused: 14,
    labelWeightRest: '600' as const,
    labelWeightFocused: '700' as const,
    labelColorRest: '#4B5563',
    labelColorFocused: colors.primary.navy,
    pillBg: 'rgba(30,58,95,0.08)',
    pillRadius: 18,
    pillPadV: 6,
    pillPadH: 10,
    hitSlop: 8,
    /** Small dot beneath the selected tab's label. */
    dotSize: 6,
    dotMarginTop: 4,
    dotColor: colors.primary.red,
  },
  primary: {
    /** Diameter of the elevated centre button. Spec calls for 64. */
    size: 64,
    /** How much the button overflows above the bar's top edge. */
    raiseOffset: 18,
    bg: colors.primary.red,
    bgPressed: colors.primary.redDark,
    iconColor: '#FFFFFF',
    iconSize: 28,
    /** Halo / cut-out ring between the bar and the raised button. */
    ringWidth: 4,
    ringColor: '#FFFFFF',
    shadowColor: colors.primary.red,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffsetY: 10,
    elevation: 12,
  },
  /** Radial fan that appears on long-press of the centre button. */
  radial: {
    chipSize: 52,
    /** Distance from the center of the primary button. */
    spacing: 64,
    staggerMs: 40,
    /** 3 chips fanned across this arc, centered straight up (-90°). */
    arcDegrees: 120,
    bg: colors.primary.navy,
    bgDisabled: '#9CA3AF',
    iconColor: '#FFFFFF',
    iconSize: 22,
  },
};

export type NavigationTheme = typeof navigationTheme;
