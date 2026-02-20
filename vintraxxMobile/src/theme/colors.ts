// VinTraxx SmartScan Theme Colors
// Based on brand logo: Dark Navy Blue + Deep Red

export const colors = {
  // Primary Brand Colors
  primary: {
    navy: '#1A3A5C',      // Main dark blue from "Traxx" / "SMARTSCAN"
    navyDark: '#122940',  // Darker variant
    navyLight: '#2A4A6C', // Lighter variant
    red: '#C41E3A',       // Deep red from "Vin"
    redDark: '#A01830',   // Darker red
    redLight: '#D43850',  // Lighter red
  },

  // UI Colors
  background: {
    primary: '#BADBFF',   // Light blue background
    secondary: '#FFFFFF', // White cards
    dark: '#1A3A5C',      // Dark header/footer
    tab: '#D5E9FF',       // Tab bar background
  },

  // Text Colors
  text: {
    primary: '#1A202C',   // Dark text
    secondary: '#4A5568', // Gray text
    muted: '#4b6996ff',     // Muted text
    light: '#A0AEC0',     // Light gray text
    inverse: '#FFFFFF',   // White text on dark backgrounds
  },

  // Status Colors
  status: {
    success: '#38A169',   // Green - passed/connected
    successLight: '#C6F6D5',
    warning: '#D69E2E',   // Yellow/Orange - warning
    warningLight: '#FEFCBF',
    error: '#E53E3E',     // Red - error/failed
    errorLight: '#FED7D7',
    info: '#3182CE',      // Blue - info
    infoLight: '#BEE3F8',
  },

  // Border Colors
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E0',
    dark: '#A0AEC0',
  },

  // Shadow (for elevation effects)
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

export type Colors = typeof colors;
