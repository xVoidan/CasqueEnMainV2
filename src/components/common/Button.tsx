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
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'tertiary';
  size?: 'small' | 'medium' | 'large' | 'compact' | 'xlarge';
  loading?: boolean;
  fullWidth?: boolean;
  customHeight?: number;
  customPadding?: { horizontal?: number; vertical?: number };
  customFontSize?: number;
  elevation?: boolean;
}


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
  // Variants with better hierarchy
  primary: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondary: {
    backgroundColor: theme.colors.gray[100],
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    elevation: 2,
  },
  outline: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: theme.colors.transparent,
  },
  tertiary: {
    backgroundColor: theme.colors.transparent,
    textDecorationLine: 'underline',
  },
  // Sizes - Optimized for mobile touch targets
  small: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    minHeight: 44, // iOS minimum
  },
  compact: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    minHeight: 40,
  },
  medium: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    minHeight: 52, // Standard mobile
  },
  large: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 18,
    minHeight: 60, // CTA primary
  },
  xlarge: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: 22,
    minHeight: 68, // Hero buttons
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  primaryText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  secondaryText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  outlineText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  ghostText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  tertiaryText: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textDecorationLine: 'underline',
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
  xlargeText: {
    fontSize: theme.typography.fontSize.xl,
  },
});


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
  elevation: _elevation = true,
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
      activeOpacity={variant === 'primary' ? 0.7 : 0.8}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
