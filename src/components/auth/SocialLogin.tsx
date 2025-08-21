import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useHaptics } from '../../hooks/useHaptics';

interface ISocialLoginProps {
  onGoogleLogin: () => void;
  onAppleLogin: () => void;
  loading?: boolean;
}

const BUTTON_HEIGHT = 48;
const ICON_SIZE = 24;

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
  },
  googleButton: {
    borderColor: theme.colors.gray[300],
  },
  appleButton: {
    borderColor: theme.colors.gray[900],
    backgroundColor: theme.colors.gray[900],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  googleText: {
    color: theme.colors.text.primary,
  },
  appleText: {
    color: theme.colors.white,
  },
});

export function SocialLogin({
  onGoogleLogin,
  onAppleLogin,
  loading = false,
}: ISocialLoginProps): React.ReactElement {
  const haptics = useHaptics();

  const handlePress = (callback: () => void): void => {
    haptics.impact();
    callback();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ou connectez-vous avec</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.googleButton, loading && styles.buttonDisabled]}
          onPress={() => handlePress(onGoogleLogin)}
          disabled={loading}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="logo-google" size={ICON_SIZE} color="#4285F4" style={styles.icon} />
            <Text style={[styles.buttonText, styles.googleText]}>Google</Text>
          </View>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={[styles.button, styles.appleButton, loading && styles.buttonDisabled]}
            onPress={() => handlePress(onAppleLogin)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="logo-apple"
                size={ICON_SIZE}
                color={theme.colors.white}
                style={styles.icon}
              />
              <Text style={[styles.buttonText, styles.appleText]}>Apple</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
