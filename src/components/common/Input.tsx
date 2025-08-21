import React, { useState, useEffect } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Animated,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface IInputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  success?: boolean;
  validateOnBlur?: boolean;
  onValidate?: (value: string) => string | undefined;
}

const INPUT_HEIGHT = 48;
const ICON_SIZE = 20;
const ANIMATION_DURATION = 200;
const SHAKE_OFFSET = 10;
const SCALE_MAX = 1.05;

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    paddingHorizontal: theme.spacing.md,
    height: INPUT_HEIGHT,
  },
  inputContainerFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  inputContainerError: {
    borderColor: theme.colors.error,
  },
  inputContainerSuccess: {
    borderColor: theme.colors.success,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  rightIcon: {
    padding: theme.spacing.xs,
  },
  error: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  validationIcon: {
    marginLeft: theme.spacing.xs,
  },
});

// Separate helper function to reduce complexity
const createShakeAnimation = (shakeAnim: Animated.Value): void => {
  Animated.sequence([
    Animated.timing(shakeAnim, {
      toValue: SHAKE_OFFSET,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnim, {
      toValue: -SHAKE_OFFSET,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnim, {
      toValue: SHAKE_OFFSET,
      duration: 100,
      useNativeDriver: true,
    }),
    Animated.timing(shakeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }),
  ]).start();
};

const createScaleAnimation = (scaleAnim: Animated.Value): void => {
  Animated.sequence([
    Animated.timing(scaleAnim, {
      toValue: SCALE_MAX,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }),
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }),
  ]).start();
};

export function Input({
  label,
  error,
  isPassword = false,
  icon,
  success = false,
  validateOnBlur = false,
  onValidate,
  style,
  onBlur,
  onChangeText,
  value,
  ...props
}: IInputProps): React.ReactElement {
  // Start with password hidden (true means hidden)
  const [hidePassword, setHidePassword] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();
  const shakeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];

  const displayError = error ?? validationError;

  useEffect(() => {
    if (displayError) {
      createShakeAnimation(shakeAnim);
    }
  }, [displayError, shakeAnim]);

  useEffect(() => {
    if (success) {
      createScaleAnimation(scaleAnim);
    }
  }, [success, scaleAnim]);

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>): void => {
    setIsFocused(false);
    if (validateOnBlur && onValidate && value) {
      const validationResult = onValidate(value);
      setValidationError(validationResult);
    }
    onBlur?.(e);
  };

  const handleChangeText = (text: string): void => {
    if (validationError) {
      setValidationError(undefined);
    }
    onChangeText?.(text);
  };

  const getIconColor = (): string => {
    if (displayError) {
      return theme.colors.error;
    }
    if (success) {
      return theme.colors.success;
    }
    return theme.colors.gray[400];
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          displayError && styles.inputContainerError,
          success && !displayError && styles.inputContainerSuccess,
          {
            transform: [{ translateX: shakeAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {icon && (
          <Ionicons name={icon} size={ICON_SIZE} color={getIconColor()} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.gray[400]}
          secureTextEntry={isPassword && hidePassword}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          value={value}
          {...props}
        />
        {success && !displayError && (
          <Ionicons
            name="checkmark-circle"
            size={ICON_SIZE}
            color={theme.colors.success}
            style={styles.validationIcon}
          />
        )}
        {isPassword && (
          <TouchableOpacity
            onPress={() => {
              setHidePassword(!hidePassword);
            }}
            style={styles.rightIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="password-toggle"
          >
            <Ionicons
              name={hidePassword ? 'eye' : 'eye-off'}
              size={ICON_SIZE}
              color={theme.colors.gray[400]}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {displayError && <Text style={styles.error}>{displayError}</Text>}
    </View>
  );
}
