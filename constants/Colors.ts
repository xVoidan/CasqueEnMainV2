/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Auth and UI colors
    primary: '#667eea',
    secondary: '#28a745',
    textPrimary: '#333',
    textSecondary: '#666',
    textMuted: '#999',
    backgroundPrimary: '#fff',
    backgroundSecondary: '#f5f5f5',
    backgroundAccent: '#f0f3ff',
    border: '#e0e0e0',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadowColor: '#000',
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Auth and UI colors
    primary: '#667eea',
    secondary: '#28a745',
    textPrimary: '#ECEDEE',
    textSecondary: '#9BA1A6',
    textMuted: '#687076',
    backgroundPrimary: '#151718',
    backgroundSecondary: '#1f2937',
    backgroundAccent: '#374151',
    border: '#374151',
    overlay: 'rgba(0, 0, 0, 0.8)',
    shadowColor: '#000',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#06b6d4',
  },
};
