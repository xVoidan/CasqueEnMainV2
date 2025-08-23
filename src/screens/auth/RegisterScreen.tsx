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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { PasswordStrengthIndicator } from '../../components/auth/PasswordStrengthIndicator';
import { OnboardingSteps } from '../../components/auth/OnboardingSteps';
import { ProgressBar } from '../../components/auth/ProgressBar';
import { SecurityBadge } from '../../components/auth/SecurityBadge';
import { LoadingAnimation } from '../../components/common/LoadingAnimation';
import { useAuth } from '../../store/AuthContext';
import { useHaptics } from '../../hooks/useHaptics';
import { theme } from '../../styles/theme';
import { FRENCH_DEPARTMENTS } from '../../constants/departments';

// Constants
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;
const PICKER_HEIGHT = 56;
const TOTAL_STEPS = 3;
const FADE_DELAY_INCREMENT = 100;
const SHADOW_COLOR = '#000';
const SHADOW_TEXT_COLOR = 'rgba(0, 0, 0, 0.3)';
const MODAL_BG_COLOR = 'rgba(0, 0, 0, 0.5)';
const MODAL_WIDTH = '90%';
const REDIRECT_DELAY = 3000;

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
    minHeight: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
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
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepContainer: {
    marginBottom: theme.spacing.md,
  },
  pickerContainer: {
    marginBottom: theme.spacing.md,
  },
  pickerLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  pickerWrapper: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[200],
    overflow: 'hidden',
    height: PICKER_HEIGHT,
    justifyContent: 'center',
  },
  pickerError: {
    borderColor: theme.colors.error,
  },
  picker: {
    height: PICKER_HEIGHT,
    width: '100%',
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
  },
  pickerItem: {
    fontSize: theme.typography.fontSize.base,
    height: PICKER_HEIGHT,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  loginText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  loginLink: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
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
    width: MODAL_WIDTH,
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  successTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  successText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  flexButton: {
    flex: 1,
  },
});

export function RegisterScreen(): React.ReactElement {
  const router = useRouter();
  const { signUp } = useAuth();
  const haptics = useHaptics();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    department: '',
  });

  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validFields, setValidFields] = useState<Record<string, boolean>>({
    email: false,
    username: false,
  });

  const stepTitles = [
    'Informations de connexion',
    'Mot de passe sécurisé',
    'Finalisation du profil',
  ];

  const stepLabels = ['Compte', 'Sécurité', 'Profil'];

  const validateEmail = (value: string): string | undefined => {
    if (!value) {
      return "L'email est requis";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email invalide';
    }
    setValidFields((prev) => ({ ...prev, email: true }));
    return undefined;
  };

  const validateUsername = (value: string): string | undefined => {
    if (!value) {
      return "Le nom d'utilisateur est requis";
    }
    if (value.length < MIN_USERNAME_LENGTH) {
      return `Au moins ${MIN_USERNAME_LENGTH} caractères`;
    }
    if (value.length > MAX_USERNAME_LENGTH) {
      return `Maximum ${MAX_USERNAME_LENGTH} caractères`;
    }
    setValidFields((prev) => ({ ...prev, username: true }));
    return undefined;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      const emailError = validateEmail(formData.email);
      if (emailError) {
        newErrors.email = emailError;
      }

      const usernameError = validateUsername(formData.username);
      if (usernameError) {
        newErrors.username = usernameError;
      }
    }

    if (step === 1) {
      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis';
      } else if (formData.password.length < MIN_PASSWORD_LENGTH) {
        newErrors.password = `Au moins ${MIN_PASSWORD_LENGTH} caractères`;
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    if (step === 2 && !formData.department) {
      newErrors.department = 'Veuillez sélectionner votre département';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      haptics.notification('error');
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (): void => {
    if (validateStep(currentStep)) {
      haptics.selection();
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1));
    }
  };

  const handlePrevStep = (): void => {
    haptics.selection();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateStep(2)) {
      return;
    }

    haptics.impact();

    try {
      setLoading(true);
      setShowLoading(true);
      await signUp(formData.email, formData.password, formData.username, formData.department);

      setShowLoading(false);
      setShowSuccess(true);
      haptics.notification('success');

      setTimeout(() => {
        router.replace('/(tabs)');
      }, REDIRECT_DELAY);
    } catch (error) {
      haptics.notification('error');
      setShowLoading(false);
      Alert.alert("Erreur d'inscription", (error as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: keyof typeof formData, value: string): void => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const renderStepContent = (): React.ReactElement | null => {
    switch (currentStep) {
      case 0:

  return (
          <FadeInView duration={400}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              error={errors.email}
              success={validFields.email}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
              validateOnBlur
              onValidate={validateEmail}
              accessibilityLabel="Adresse email"
            />

            <Input
              label="Nom d'utilisateur"
              placeholder="Votre pseudo"
              value={formData.username}
              onChangeText={(value) => updateFormData('username', value)}
              error={errors.username}
              success={validFields.username}
              autoCapitalize="none"
              icon="person"
              validateOnBlur
              onValidate={validateUsername}
              accessibilityLabel="Nom d'utilisateur"
            />
          </FadeInView>
        );

      case 1:
        return (
          <FadeInView duration={400}>
            <Input
              key="password-main"
              label="Mot de passe"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              error={errors.password}
              isPassword
              icon="lock-closed"
              accessibilityLabel="Mot de passe"
              testID="password-input"
            />

            <PasswordStrengthIndicator password={formData.password} />

            <Input
              key="password-confirm"
              label="Confirmer le mot de passe"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              error={errors.confirmPassword}
              isPassword
              icon="lock-closed"
              accessibilityLabel="Confirmation du mot de passe"
              testID="confirm-password-input"
            />
          </FadeInView>
        );

      case 2:
        return (
          <FadeInView duration={400}>
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Département</Text>
              <View
                style={[styles.pickerWrapper, errors.department ? styles.pickerError : undefined]}
              >
                <Picker
                  selectedValue={formData.department}
                  onValueChange={(value) => updateFormData('department', value)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                  numberOfLines={1}
                >
                  {FRENCH_DEPARTMENTS.map((dept) => (
                    <Picker.Item key={dept.value} label={dept.label} value={dept.value} />
                  ))}
                </Picker>
              </View>
              {errors.department && <Text style={styles.errorText}>{errors.department}</Text>}
            </View>

            <SecurityBadge style={styles.dynamicStyle1} />
          </FadeInView>
        );

      default:
        return null;
    }
  };

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
            <FadeInView duration={600} delay={0}>
              <View style={styles.header}>
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>
                  Rejoignez la communauté des futurs sapeurs-pompiers
                </Text>
              </View>
            </FadeInView>

            <FadeInView duration={600} delay={FADE_DELAY_INCREMENT}>
              <View style={styles.contentCard}>
                <ProgressBar
                  currentStep={currentStep}
                  totalSteps={TOTAL_STEPS}
                  labels={stepLabels}
                />
                <OnboardingSteps
                  currentStep={currentStep}
                  totalSteps={TOTAL_STEPS}
                  title={stepTitles[currentStep]}
                />

                <View style={styles.formContainer}>
                  <View style={styles.stepContainer}>{renderStepContent()}</View>

                  {currentStep === 0 ? (
                    <Button
                      title="Suivant"
                      onPress={handleNextStep}
                      size="medium"
                      fullWidth
                    />
                  ) : (
                    <View style={styles.navigationButtons}>
                      <Button
                        title="Précédent"
                        variant="outline"
                        onPress={handlePrevStep}
                        size="medium"
                        style={styles.flexButton}
                      />
                      {currentStep < TOTAL_STEPS - 1 ? (
                        <Button
                          title="Suivant"
                          onPress={handleNextStep}
                          size="medium"
                          style={styles.flexButton}
                        />
                      ) : (
                        <Button
                          title="S'inscrire"

                          onPress={handleRegister}
                          loading={loading}
                          size="medium"
                          style={styles.flexButton}
                        />
                      )}
                    </View>
                  )}

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Déjà un compte ?</Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                      <Text style={styles.loginLink}>Se connecter</Text>
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
              <LoadingAnimation message="Création de votre compte..." />
            </View>
          </View>
        </Modal>

        <Modal visible={showSuccess} transparent animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>🎉 Inscription réussie !</Text>
                <Text style={styles.successText}>
                  Bienvenue chez Casque En Mains !{'\n'}
                  Vous êtes maintenant Aspirant.{'\n\n'}
                  Redirection en cours...
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}
