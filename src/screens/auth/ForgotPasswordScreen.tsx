// Performance optimized
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../store/AuthContext';
import { theme } from '../../styles/theme';

// Constants
const ICON_SIZE = {
  back: 24,
  lock: 48,
  success: 64,
} as const;

const ICON_WRAPPER_SIZE = 100;
const AUTH_LOGIN_ROUTE = '/(auth)/login';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconWrapper: {
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  formContainer: {
    flex: 1,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  loginLinkText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  successText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  successButton: {
    marginTop: theme.spacing.md,
  },
});

export function ForgotPasswordScreen(): React.ReactElement {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (): boolean => {
    if (!email) {
      setError("L'email est requis");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalide');
      return false;
    }
    setError('');
    return true;
  };

  const handleResetPassword = async (): Promise<void> => {
    if (!validateEmail()) {
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setEmailSent(true);
      Alert.alert('Email envoyé', 'Un email de réinitialisation a été envoyé à votre adresse.', [
        {
          text: 'OK',
          onPress: () => router.push(AUTH_LOGIN_ROUTE),
        },
      ]);
    } catch (err) {
      Alert.alert('Erreur', (err as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={ICON_SIZE.back} color={theme.colors.text.primary} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.iconWrapper}>
              <Ionicons name="lock-closed" size={ICON_SIZE.lock} color={theme.colors.primary} />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Mot de passe oublié ?</Text>
            <Text style={styles.subtitle}>
              Pas de panique ! Entrez votre email et nous vous enverrons un lien pour réinitialiser
              votre mot de passe.
            </Text>
          </View>

          {emailSent ? (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={ICON_SIZE.success}
                  color={theme.colors.success}
                />
              </View>
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successText}>
                Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser
                votre mot de passe.
              </Text>
              <Button
                title="Retour à la connexion"
                onPress={() => router.push(AUTH_LOGIN_ROUTE)}
                fullWidth
                size="large"
                style={styles.successButton}
              />
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Input
                label="Email"
                placeholder="votre@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError('');
                }}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail"
              />

              <Button
                title="Envoyer le lien"

                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                size="large"
              />

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push(AUTH_LOGIN_ROUTE)}
              >
                <Text style={styles.loginLinkText}>Je me souviens de mon mot de passe</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
