// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React, { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

// Constants
const DEFAULT_SIZE = 24;

/**
 * Supported icon names for IconSymbol component
 */
type IconSymbolName =
  | 'house.fill'
  | 'paperplane.fill'
  | 'chevron.left.forwardslash.chevron.right'
  | 'chevron.right';

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = DEFAULT_SIZE,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}): React.ReactElement {
  // Use a switch statement to avoid object injection warnings
  let iconName: ComponentProps<typeof MaterialIcons>['name'];
  switch (name) {
    case 'house.fill':
      iconName = 'home';
      break;
    case 'paperplane.fill':
      iconName = 'send';
      break;
    case 'chevron.left.forwardslash.chevron.right':
      iconName = 'code';
      break;
    case 'chevron.right':
      iconName = 'chevron-right';
      break;
    default:
      iconName = 'home'; // fallback
      break;
  }
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
