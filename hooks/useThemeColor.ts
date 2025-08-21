/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Helper function to get color by name
function getColorByName(
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
  isDark: boolean,
): string {
  const themeColors = isDark ? Colors.dark : Colors.light;
  switch (colorName) {
    case 'text':
      return themeColors.text;
    case 'background':
      return themeColors.background;
    case 'tint':
      return themeColors.tint;
    case 'icon':
      return themeColors.icon;
    case 'tabIconDefault':
      return themeColors.tabIconDefault;
    case 'tabIconSelected':
      return themeColors.tabIconSelected;
    default:
      return themeColors.text;
  }
}

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
): string {
  const theme = useColorScheme() ?? 'light';
  const isDark = theme === 'dark';
  const colorFromProps = isDark ? props.dark : props.light;

  return colorFromProps ?? getColorByName(colorName, isDark);
}
