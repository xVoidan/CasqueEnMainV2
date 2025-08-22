// Performance optimized
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Checkbox } from '../../components/common/Checkbox';
import { LoadingAnimation } from '../../components/common/LoadingAnimation';
import { GradientBackground } from '../../components/common/GradientBackground';
import { CustomModal } from '../../components/common/CustomModal';
import { FadeInView } from '../../components/animations/FadeInView';
import { SocialLogin } from '../../components/auth/SocialLogin';
import { SecurityBadge } from '../../components/auth/SecurityBadge';
import { BiometricSetupModal } from '../../components/auth/BiometricSetupModal';
import { LogoDisplay } from '../../components/common/LogoDisplay';
import { useLoginScreen } from './LoginScreen.hooks';
import { theme } from '../../styles/theme';

// Constants
const LOGO_SIZE = 120;
const BIOMETRIC_ICON_SIZE = 32;
const FADE_DELAY_INCREMENT = 100;
const SHADOW_COLOR = '#000';
const SHADOW_TEXT_COLOR = 'rgba(0, 0, 0, 0.3)';
const MODAL_OPACITY = 0.9;
const MODAL_BG_COLOR = 'rgba(0, 0, 0, 0.5)';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  contentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: LOGO_SIZE / 2,
    padding: 15,
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    textShadowColor: SHADOW_TEXT_COLOR,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    opacity: MODAL_OPACITY,
  },
  formContainer: {
    flex: 1,
  },
  rememberContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  forgotPassword: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[200],
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  registerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  registerLink: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  biometricButton: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: MODAL_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '90%',
  },
});

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen(): React.ReactElement {
  const router = useRouter();
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    loading,
    showLoading,
    errors,
    validEmail,
    biometricAvailable,
    biometricType,
    googleAuthAvailable,
    handleLogin,
    handleBiometricLogin,
    handleContinueAsGuest,
    handleGoogleSignIn,
    handleAppleSignIn,
    validateEmail,
    modalVisible,
    setModalVisible,
    modalConfig,
    biometricSetupVisible,
    setBiometricSetupVisible: _setBiometricSetupVisible,
    handleBiometricSetupAccept,
    handleBiometricSetupDecline,
  } = useLoginScreen();

  
  const handlePress = useCallback(() => {
    // TODO: Implement onPress logic
  }, []);

  
  const handlePress = useCallback(() => {
    // TODO: Implement onPress logic
  }, []);

  
  const handlePress = useCallback(() => {
    // TODO: Implement onPress logic
  }, []);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {biometricAvailable && (
              <TouchableOpacity
                style={styles.biometricButton}
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                onPress={handleBiometricLogin}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="finger-print"
                  size={BIOMETRIC_ICON_SIZE}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            )}

            <FadeInView duration={600} delay={0}>
              <View style={styles.logoContainer}>
                <LogoDisplay
                  size={200}
                  animated
                  showHalo
                  showParticles={false}
                  style={styles.dynamicStyle1}
                />
                <Text style={styles.title}>Casque En Mains</Text>
                <Text style={styles.subtitle}>Préparez-vous aux concours SPP</Text>
              </View>
            </FadeInView>

            <FadeInView duration={600} delay={FADE_DELAY_INCREMENT}>
              <View style={styles.contentCard}>
                <SecurityBadge style={styles.dynamicStyle2} />

                <View style={styles.formContainer}>
                  <Input
                    label="Email"
                    placeholder="votre@email.com"
                    value={email}
                    onChangeText={setEmail}
                    error={errors.email}
                    success={validEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="mail"
                    validateOnBlur
                    onValidate={validateEmail}
                    accessibilityLabel="Adresse email"
                    accessibilityHint="Entrez votre adresse email pour vous connecter"
                  />

                  <Input
                    label="Mot de passe"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    error={errors.password}
                    isPassword
                    icon="lock-closed"
                    accessibilityLabel="Mot de passe"
                    accessibilityHint="Entrez votre mot de passe"
                  />

                  <View style={styles.rememberContainer}>
                    <Checkbox
                      checked={rememberMe}
                      onPress={handlePress} setRememberMe(!rememberMe)}
                      label="Se souvenir de moi"
                    />
                    <TouchableOpacity
                      style={styles.forgotPassword}
                      onPress={handlePress} router.push('/(auth)/forgot-password')}
                    >
                      <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                    </TouchableOpacity>
                  </View>

                  <Button
                    title="Se connecter"
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onPress={handleLogin}
                    loading={loading}
                    fullWidth
                    size="medium"
                  />

                  {googleAuthAvailable && (
                    <SocialLogin
                      onGoogleLogin={handleGoogleSignIn}
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onAppleLogin={handleAppleSignIn}
                      loading={loading}
                    />
                  )}

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OU</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Button
                    title="Continuer en invité"
                    variant="outline"
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onPress={handleContinueAsGuest}
                    loading={loading}
                    fullWidth
                    size="medium"
                  />

                  <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>Pas encore de compte ?</Text>
                    <TouchableOpacity onPress={handlePress} router.push('/(auth)/register')}>
                      <Text style={styles.registerLink}>S&apos;inscrire</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </FadeInView>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={showLoading} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <LoadingAnimation />
            </View>
          </View>
        </Modal>

        <CustomModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          title={modalConfig.title}
          message={modalConfig.message}
          type={modalConfig.type}
          buttons={modalConfig.buttons}
        />

        <BiometricSetupModal
          visible={biometricSetupVisible}
          biometricType={biometricType}
          onAccept={() => {
            void handleBiometricSetupAccept();
          }}
          onDecline={handleBiometricSetupDecline}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}
