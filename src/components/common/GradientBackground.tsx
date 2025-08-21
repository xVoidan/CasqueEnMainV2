import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ViewStyle } from 'react-native';
import { theme } from '../../styles/theme';

interface IGradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  colors?: readonly [string, string, ...string[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

const DEFAULT_COLORS: readonly [string, string] = [
  theme.colors.primary,
  theme.colors.secondary,
] as const;
const DEFAULT_START = { x: 0, y: 0 };
const DEFAULT_END = { x: 1, y: 1 };

const gradientStyle = { flex: 1 };

export function GradientBackground({
  children,
  style,
  colors = DEFAULT_COLORS,
  start = DEFAULT_START,
  end = DEFAULT_END,
}: IGradientBackgroundProps): React.ReactElement {
  return (
    <LinearGradient colors={colors} start={start} end={end} style={[gradientStyle, style]}>
      {children}
    </LinearGradient>
  );
}
