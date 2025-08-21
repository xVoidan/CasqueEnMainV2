import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../store/AuthContext';
import { BiometricAuthService } from '../../services/biometricAuth';
import { useHaptics } from '../../hooks/useHaptics';

interface ILoginHookReturn {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  rememberMe: boolean;
  setRememberMe: (value: boolean) => void;
  loading: boolean;
  showLoading: boolean;
  errors: { email?: string; password?: string };
  validEmail: boolean;
  biometricAvailable: boolean;
  biometricType: string;
  googleAuthAvailable: boolean;
  handleLogin: () => Promise<void>;
  handleBiometricLogin: () => Promise<void>;
  handleContinueAsGuest: () => Promise<void>;
  handleGoogleSignIn: () => void;
  handleAppleSignIn: () => Promise<void>;
  validateEmail: (value: string) => string | undefined;
}

const MIN_PASSWORD_LENGTH = 6;

// Check if Google Auth is properly configured
const isGoogleAuthConfigured = (): boolean => {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  // Check platform-specific requirements
  if (Platform.OS === 'ios' && !iosClientId) {
    return false;
  }
  if (Platform.OS === 'android' && !androidClientId) {
    return false;
  }

  return Boolean(webClientId);
};

export function useLoginScreen(): ILoginHookReturn {
  const _router = useRouter();
  const { signIn, continueAsGuest } = useAuth();
  const haptics = useHaptics();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [validEmail, setValidEmail] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biométrie');
  const [googleAuthAvailable] = useState(isGoogleAuthConfigured());

  // Google Auth - conditional initialization
  const googleAuthConfig = googleAuthAvailable
    ? {
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      }
    : undefined;

  const [_request, response, promptAsync] = googleAuthAvailable
    ? Google.useAuthRequest(googleAuthConfig)
    : [undefined, undefined, undefined];

  const checkBiometricAvailability = async (): Promise<void> => {
    const isAvailable = await BiometricAuthService.isBiometricSupported();
    setBiometricAvailable(isAvailable);
    if (isAvailable) {
      const type = await BiometricAuthService.getBiometricType();
      setBiometricType(type);
    }
  };

  const loadRememberedEmail = async (): Promise<void> => {
    const { rememberMe: remembered, email: savedEmail } =
      await BiometricAuthService.getRememberedEmail();
    if (remembered && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      setValidEmail(true);
    }
  };

  const processGoogleSignIn = useCallback(
    async (accessToken?: string): Promise<void> => {
      if (!accessToken) {
        return;
      }

      try {
        setLoading(true);
        setShowLoading(true);

        // Récupérer les informations utilisateur depuis Google
        const googleUserResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const googleUser = await googleUserResponse.json();

        if (!googleUser?.email) {
          throw new Error("Impossible de récupérer l'email depuis Google");
        }

        // Utiliser l'email Google pour la connexion/inscription
        await signIn(googleUser.email, `google-${googleUser.id}`, {
          isGoogleAuth: true,
          googleUser: {
            name: googleUser.name,
            picture: googleUser.picture,
            verified_email: googleUser.verified_email,
          },
        });

        haptics.notification('success');
      } catch (error) {
        haptics.notification('error');
        Alert.alert('Erreur', (error as Error).message ?? 'Impossible de se connecter avec Google');
      } finally {
        setLoading(false);
        setShowLoading(false);
      }
    },
    [signIn, haptics],
  );

  useEffect(() => {
    void checkBiometricAvailability();
    void loadRememberedEmail();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && googleAuthAvailable) {
      void processGoogleSignIn(response.authentication?.accessToken);
    }
  }, [response, googleAuthAvailable, processGoogleSignIn]);

  const validateEmail = (value: string): string | undefined => {
    if (!value) {
      return "L'email est requis";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Email invalide';
    }
    setValidEmail(true);
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    const emailError = validateEmail(email);
    if (emailError) {
      newErrors.email = emailError;
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      newErrors.password = `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (): Promise<void> => {
    haptics.impact();
    if (!validateForm()) {
      haptics.notification('error');
      return;
    }

    try {
      setLoading(true);
      setShowLoading(true);

      if (rememberMe) {
        await BiometricAuthService.setRememberMe(true, email);
      }

      await signIn(email, password);
      haptics.notification('success');
    } catch (error) {
      haptics.notification('error');
      Alert.alert('Erreur de connexion', (error as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  };

  const handleBiometricLogin = async (): Promise<void> => {
    haptics.impact();
    const authenticated = await BiometricAuthService.authenticate(
      `Utilisez ${biometricType} pour vous connecter`,
    );

    if (authenticated) {
      haptics.notification('success');
      // TODO: Implémenter la connexion avec les credentials stockés
      Alert.alert('Succès', 'Authentification biométrique réussie');
    } else {
      haptics.notification('error');
    }
  };

  const handleGoogleSignIn = (): void => {
    if (googleAuthAvailable && promptAsync) {
      void promptAsync();
    } else {
      Alert.alert(
        'Configuration manquante',
        "La connexion Google n'est pas configurée. Veuillez ajouter les clés OAuth dans le fichier .env",
      );
    }
  };

  const handleAppleSignIn = async (): Promise<void> => {
    haptics.impact();
    // TODO: Implémenter Apple Sign In
    Alert.alert('Info', 'Connexion Apple à implémenter');
  };

  const handleContinueAsGuest = async (): Promise<void> => {
    haptics.impact();
    try {
      setLoading(true);
      setShowLoading(true);
      await continueAsGuest();
      haptics.notification('success');
    } catch (error) {
      haptics.notification('error');
      Alert.alert('Erreur', (error as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  };

  return {
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
  };
}
