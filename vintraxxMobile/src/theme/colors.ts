// VinTraxx SmartScan Theme Colors
// Clean modern palette: White, Red, Blue / Light Blue

export const colors = {
  // Primary Brand Colors
  primary: {
    navy: '#1E3A5F',      // Rich blue
    navyDark: '#152D4A',  // Darker variant
    navyLight: '#2B5A8C', // Lighter variant
    red: '#DC2626',       // Clean red accent
    redDark: '#B91C1C',   // Darker red
    redLight: '#EF4444',  // Lighter red
  },

  // UI Colors
  background: {
    primary: '#F0F6FF',   // Very light blue-white tint
    secondary: '#FFFFFF', // White cards
    dark: '#1E3A5F',      // Dark header/footer
    tab: '#FFFFFF',       // Clean white tab bar
  },

  // Text Colors
  text: {
    primary: '#111827',   // Near-black text
    secondary: '#4B5563', // Gray text
    muted: '#9CA3AF',     // Muted text
    light: '#D1D5DB',     // Light gray text
    inverse: '#FFFFFF',   // White text on dark backgrounds
  },

  // Status Colors
  status: {
    success: '#16A34A',   // Green - passed/connected
    successLight: '#DCFCE7',
    warning: '#D97706',   // Amber - warning
    warningLight: '#FEF3C7',
    error: '#DC2626',     // Red - error/failed
    errorLight: '#FEE2E2',
    info: '#2563EB',      // Blue - info
    infoLight: '#DBEAFE',
  },

  // Border Colors
  border: {
    light: '#E5E7EB',
    medium: '#D1D5DB',
    dark: '#9CA3AF',
  },

  // Shadow (for elevation effects)
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.15)',
};

export type Colors = typeof colors;
