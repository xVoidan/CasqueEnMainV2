import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '@/src/hooks/useHaptics';
import { theme } from '@/src/styles/theme';

interface IHapticButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}

export const HapticButton: React.FC<IHapticButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'medium',
  hapticType = 'light',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  children,
  disabled,
  style,
  accessibilityLabel,
  ...props
}) => {
  const haptics = useHaptics();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(async (event: GestureResponderEvent) => {
    if (disabled || loading) return;

    // Haptic feedback basé sur le type
    switch (hapticType) {
      case 'selection':
        await haptics.selection();
        break;
      case 'medium':
        await haptics.press();
        break;
      case 'heavy':
        await haptics.longPress();
        break;
      default:
        await haptics.tap();
    }

    if (onPress) {
      await onPress(event);
    }
  }, [disabled, loading, hapticType, haptics, onPress]);

  const getButtonStyles = () => {
    const baseStyles = [
      styles.button,
      styles[`button_${size}`],
      fullWidth && styles.fullWidth,
      rounded && styles.rounded,
      (disabled || loading) && styles.disabled,
    ];

    if (variant === 'primary') {
      return null; // Utilise LinearGradient
    }

    return [
      ...baseStyles,
      styles[`button_${variant}`],
      style,
    ];
  };

  const getTextStyles = () => [
    styles.text,
    styles[`text_${size}`],
    styles[`text_${variant}`],
    (disabled || loading) && styles.textDisabled,
  ];

  const getIconSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' || variant === 'secondary' ? theme.colors.primary : theme.colors.white}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={variant === 'ghost' || variant === 'secondary' ? theme.colors.primary : theme.colors.white}
              style={styles.iconLeft}
            />
          )}
          {typeof children === 'string' ? (
            <Text style={getTextStyles()}>{children}</Text>
          ) : (
            children
          )}
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={variant === 'ghost' || variant === 'secondary' ? theme.colors.primary : theme.colors.white}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </>
  );

  const buttonContent = variant === 'primary' && !disabled && !loading ? (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={[
        styles.button,
        styles[`button_${size}`],
        styles.gradient,
        fullWidth && styles.fullWidth,
        rounded && styles.rounded,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      {renderContent()}
    </LinearGradient>
  ) : (
    <View style={getButtonStyles()}>
      {renderContent()}
    </View>
  );

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        {...props}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Boutons prédéfinis pour les cas courants
export const PrimaryButton: React.FC<Omit<IHapticButtonProps, 'variant'>> = (props) => (
  <HapticButton variant="primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<IHapticButtonProps, 'variant'>> = (props) => (
  <HapticButton variant="secondary" {...props} />
);

export const DangerButton: React.FC<Omit<IHapticButtonProps, 'variant'>> = (props) => (
  <HapticButton variant="danger" hapticType="heavy" {...props} />
);

export const SuccessButton: React.FC<Omit<IHapticButtonProps, 'variant'>> = (props) => (
  <HapticButton variant="success" hapticType="medium" {...props} />
);

export const IconButton: React.FC<Omit<IHapticButtonProps, 'variant'> & { icon: keyof typeof Ionicons.glyphMap }> = (props) => (
  <HapticButton variant="ghost" size="small" rounded {...props} />
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
  },
  gradient: {
    overflow: 'hidden',
  },
  button_small: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 32,
  },
  button_medium: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 44,
  },
  button_large: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    minHeight: 56,
  },
  button_primary: {
    backgroundColor: theme.colors.primary,
  },
  button_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  button_danger: {
    backgroundColor: theme.colors.error,
  },
  button_success: {
    backgroundColor: theme.colors.success,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  rounded: {
    borderRadius: theme.borderRadius.full,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  text_small: {
    fontSize: theme.typography.fontSize.sm,
  },
  text_medium: {
    fontSize: theme.typography.fontSize.base,
  },
  text_large: {
    fontSize: theme.typography.fontSize.lg,
  },
  text_primary: {
    color: theme.colors.white,
  },
  text_secondary: {
    color: theme.colors.primary,
  },
  text_danger: {
    color: theme.colors.white,
  },
  text_success: {
    color: theme.colors.white,
  },
  text_ghost: {
    color: theme.colors.primary,
  },
  textDisabled: {
    opacity: 0.7,
  },
  iconLeft: {
    marginRight: theme.spacing.sm,
  },
  iconRight: {
    marginLeft: theme.spacing.sm,
  },
});