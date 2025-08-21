import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../styles/theme';

interface IButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'compact';
  loading?: boolean;
  fullWidth?: boolean;
  customHeight?: number;
  customPadding?: { horizontal?: number; vertical?: number };
  customFontSize?: number;
}

/* eslint-disable react-native/no-unused-styles */
const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: theme.colors.transparent,
  },
  // Sizes
  small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  compact: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    minHeight: 32,
  },
  medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    minHeight: 56,
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.white,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghostText: {
    color: theme.colors.primary,
  },
  smallText: {
    fontSize: theme.typography.fontSize.sm,
  },
  compactText: {
    fontSize: theme.typography.fontSize.sm,
  },
  mediumText: {
    fontSize: theme.typography.fontSize.base,
  },
  largeText: {
    fontSize: theme.typography.fontSize.lg,
  },
});
/* eslint-enable react-native/no-unused-styles */

export function Button({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  customHeight,
  customPadding,
  customFontSize,
  ...props
}: IButtonProps): React.ReactElement {
  const buttonStyles: ViewStyle[] = [
    styles.base,

    styles[variant],

    !customHeight && styles[size],
    fullWidth && styles.fullWidth,
    (disabled ?? loading) && styles.disabled,
    typeof customHeight === 'number' && { minHeight: customHeight },
    customPadding !== undefined && {
      paddingHorizontal: customPadding.horizontal,
      paddingVertical: customPadding.vertical,
    },
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`${variant}Text` as keyof typeof styles] as TextStyle,
    !customFontSize && (styles[`${size}Text` as keyof typeof styles] as TextStyle),
    typeof customFontSize === 'number' && { fontSize: customFontSize },
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled ?? loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.white : theme.colors.primary}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
