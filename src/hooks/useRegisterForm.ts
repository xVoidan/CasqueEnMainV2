import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../store/AuthContext';
import { useHaptics } from './useHaptics';
import { rateLimiter } from '../services/rateLimiter';

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 20;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const REDIRECT_DELAY = 3000;

interface IFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  department: string;
}

interface IUseRegisterFormReturn {
  formData: IFormData;
  currentStep: number;
  loading: boolean;
  showLoading: boolean;
  showSuccess: boolean;
  errors: Record<string, string>;
  validFields: Record<string, boolean>;
  updateFormData: (key: keyof IFormData, value: string) => void;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleRegister: () => Promise<void>;
  validateEmail: (value: string) => string | undefined;
  validateUsername: (value: string) => string | undefined;
  validatePassword: (value: string) => string | undefined;
}

export function useRegisterForm(): IUseRegisterFormReturn {
  const router = useRouter();
  const { signUp } = useAuth();
  const haptics = useHaptics();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<IFormData>({
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
    password: false,
  });

  const validateEmail = useCallback((value: string): string | undefined => {
    if (!value) {
      return "L'email est requis";
    }
    if (!EMAIL_REGEX.test(value)) {
      return 'Email invalide';
    }

    // Check for common typos
    if (value.includes('..') || value.includes('@.') || value.includes('.@')) {
      return 'Format email incorrect';
    }

    setValidFields((prev) => ({ ...prev, email: true }));
    return undefined;
  }, []);

  const validateUsername = useCallback((value: string): string | undefined => {
    if (!value) {
      return "Le nom d'utilisateur est requis";
    }
    if (value.length < MIN_USERNAME_LENGTH) {
      return `Au moins ${MIN_USERNAME_LENGTH} caractères`;
    }
    if (value.length > MAX_USERNAME_LENGTH) {
      return `Maximum ${MAX_USERNAME_LENGTH} caractères`;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Lettres, chiffres, - et _ uniquement';
    }

    setValidFields((prev) => ({ ...prev, username: true }));
    return undefined;
  }, []);

  const validatePassword = useCallback((value: string): string | undefined => {
    if (!value) {
      return 'Le mot de passe est requis';
    }
    if (value.length < MIN_PASSWORD_LENGTH) {
      return `Au moins ${MIN_PASSWORD_LENGTH} caractères`;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return 'Doit contenir majuscules, minuscules et chiffres';
    }

    setValidFields((prev) => ({ ...prev, password: true }));
    return undefined;
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
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
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          newErrors.password = passwordError;
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
    },
    [formData, validateEmail, validateUsername, validatePassword, haptics],
  );

  const handleNextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      haptics.selection();
      setCurrentStep((prev) => Math.min(prev + 1, 2));
    }
  }, [currentStep, validateStep, haptics]);

  const handlePrevStep = useCallback(() => {
    haptics.selection();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, [haptics]);

  const handleRegister = useCallback(async (): Promise<void> => {
    if (!validateStep(2)) {
      return;
    }

    // Check rate limit
    const rateLimitCheck = await rateLimiter.checkLimit(`register:${formData.email}`);
    if (!rateLimitCheck.allowed) {
      const timeMessage = rateLimiter.formatRemainingTime(rateLimitCheck.remainingTime ?? 0);
      Alert.alert('Trop de tentatives', `Veuillez patienter ${timeMessage} avant de réessayer.`);
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

      // Handle specific error messages
      const errorMessage = (error as Error).message;
      const INSCRIPTION_ERROR = "Erreur d'inscription";
      if (errorMessage.includes('email')) {
        Alert.alert(INSCRIPTION_ERROR, 'Cet email est déjà utilisé');
      } else if (errorMessage.includes('password')) {
        Alert.alert(INSCRIPTION_ERROR, "Le mot de passe n'est pas assez sécurisé");
      } else {
        Alert.alert(INSCRIPTION_ERROR, 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateStep, haptics, signUp, router]);

  const updateFormData = useCallback(
    (key: keyof IFormData, value: string): void => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev) => ({ ...prev, [key]: '' }));
      }

      // Reset validation state when changing
      if (validFields[key]) {
        setValidFields((prev) => ({ ...prev, [key]: false }));
      }
    },
    [errors, validFields],
  );

  return {
    formData,
    currentStep,
    loading,
    showLoading,
    showSuccess,
    errors,
    validFields,
    updateFormData,
    handleNextStep,
    handlePrevStep,
    handleRegister,
    validateEmail,
    validateUsername,
    validatePassword,
  };
}
