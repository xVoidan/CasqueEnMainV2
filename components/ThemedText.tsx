import type React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';

// Constants
const DEFAULT_FONT_SIZE = 16;
const DEFAULT_LINE_HEIGHT = 24;
const TITLE_FONT_SIZE = 32;
const TITLE_LINE_HEIGHT = 32;
const SUBTITLE_FONT_SIZE = 20;
const LINK_LINE_HEIGHT = 30;
const LINK_FONT_SIZE = 16;
const SEMIBOLD_FONT_WEIGHT = '600';

const styles = StyleSheet.create({
  default: {
    fontSize: DEFAULT_FONT_SIZE,
    lineHeight: DEFAULT_LINE_HEIGHT,
  },
  defaultSemiBold: {
    fontSize: DEFAULT_FONT_SIZE,
    lineHeight: DEFAULT_LINE_HEIGHT,
    fontWeight: SEMIBOLD_FONT_WEIGHT,
  },
  title: {
    fontSize: TITLE_FONT_SIZE,
    fontWeight: 'bold',
    lineHeight: TITLE_LINE_HEIGHT,
  },
  subtitle: {
    fontSize: SUBTITLE_FONT_SIZE,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: LINK_LINE_HEIGHT,
    fontSize: LINK_FONT_SIZE,
    color: Colors.light.tint,
  },
});

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps): React.ReactElement {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
