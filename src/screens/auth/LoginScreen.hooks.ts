import { useState, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../store/AuthContext';
import { BiometricAuthService } from '../../services/biometricAuth';
import { useHaptics } from '../../hooks/useHaptics';
import { supabase } from '../../services/supabase';

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
  modalVisible: boolean;
  setModalVisible: (value: boolean) => void;
  modalConfig: {
    title: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
    buttons?: {
      text: string;
      onPress: () => void;
      style?: 'primary' | 'secondary' | 'danger';
    }[];
  };
  biometricSetupVisible: boolean;
  setBiometricSetupVisible: (value: boolean) => void;
  handleBiometricSetupAccept: () => Promise<void>;
  handleBiometricSetupDecline: () => void;
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
  const [modalVisible, setModalVisible] = useState(false);
  const [biometricSetupVisible, setBiometricSetupVisible] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState<{ email: string; password: string } | null>(null);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'error' | 'success' | 'warning' | 'info',
    buttons: undefined as any,
  });

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

      // Vérifier si on doit proposer la biométrie
      const shouldShow = await BiometricAuthService.shouldShowBiometricSetup();
      if (shouldShow) {
        setCurrentCredentials({ email, password });
        setBiometricSetupVisible(true);
      }
    } catch (error: any) {
      haptics.notification('error');
      const errorMessage = error.message ?? 'Une erreur est survenue';

      console.error('Error details:', {
        message: error.message,
        code: error.code,
        email: error.email,
        fullError: error,
      }); // Pour déboguer en détail

      // Si l'email n'est pas confirmé, proposer de renvoyer l'email
      // Vérifier plusieurs conditions pour être sûr de détecter l'erreur
      const isEmailNotConfirmed =
        error.code === 'EMAIL_NOT_CONFIRMED' ||
        errorMessage.includes("n'est pas encore confirmée") ||
        errorMessage.includes("email n'est pas") ||
        errorMessage.includes('confirmé');

      if (isEmailNotConfirmed) {
        setModalConfig({
          title: '📧 Email non confirmé',
          message: errorMessage,
          type: 'warning',
          buttons: [
            {
              text: 'Renvoyer l\'email',
              style: 'primary',
              onPress: async () => {
                setModalVisible(false);
                try {
                  setLoading(true);
                  // Utiliser l'email saisi dans le formulaire
                  const emailToResend = error.email ?? email;
                  console.warn('Resending email to:', emailToResend);

                  const { data, error: resendError } = await supabase.auth.resend({
                    type: 'signup',
                    email: emailToResend,
                    options: {
                      emailRedirectTo: __DEV__
                        ? 'http://localhost:8081'
                        : 'casqueenmainv2://email-confirmed',
                    },
                  });

                  console.warn('Resend response:', { data, error: resendError });

                  if (resendError) {
                    console.error('Resend error details:', resendError);
                    setModalConfig({
                      title: '❌ Erreur',
                      message: 'Impossible de renvoyer l\'email de confirmation. Veuillez réessayer plus tard.',
                      type: 'error',
                      buttons: [{ text: 'OK', style: 'primary', onPress: () => setModalVisible(false) }],
                    });
                    setModalVisible(true);
                  } else {
                    setModalConfig({
                      title: '✉️ Email envoyé !',
                      message: 'Un nouvel email de confirmation a été envoyé.\n\nVeuillez vérifier votre boîte de réception et vos spams.',
                      type: 'success',
                      buttons: [{ text: 'Compris', style: 'primary', onPress: () => setModalVisible(false) }],
                    });
                    setModalVisible(true);
                  }
                } catch (catchError) {
                  console.error('Unexpected error during resend:', catchError);
                  setModalConfig({
                    title: '❌ Erreur',
                    message: `Une erreur est survenue lors de l'envoi de l'email: ${(catchError as Error).message || 'Erreur inconnue'}`,
                    type: 'error',
                    buttons: [{ text: 'OK', style: 'primary', onPress: () => setModalVisible(false) }],
                  });
                  setModalVisible(true);
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              text: 'Fermer',
              style: 'secondary',
              onPress: () => setModalVisible(false),
            },
          ],
        });
        setModalVisible(true);
      } else {
        setModalConfig({
          title: '🔐 Erreur de connexion',
          message: errorMessage,
          type: 'error',
          buttons: [{ text: 'Réessayer', style: 'primary', onPress: () => setModalVisible(false) }],
        });
        setModalVisible(true);
      }
    } finally {
      setLoading(false);
      setShowLoading(false);
    }
  };

  const handleBiometricLogin = async (): Promise<void> => {
    haptics.impact();

    // Vérifier d'abord si la biométrie est activée
    const biometricEnabled = await BiometricAuthService.isBiometricEnabled();
    if (!biometricEnabled) {
      setModalConfig({
        title: '🔐 Biométrie non configurée',
        message: 'Veuillez d\'abord vous connecter avec vos identifiants pour activer la biométrie.',
        type: 'warning',
        buttons: [{ text: 'Compris', style: 'primary', onPress: () => setModalVisible(false) }],
      });
      setModalVisible(true);
      return;
    }

    const authenticated = await BiometricAuthService.authenticate(
      `Utilisez ${biometricType} pour vous connecter`,
    );

    if (authenticated) {
      const credentials = await BiometricAuthService.getCredentials();
      if (credentials) {
        try {
          setLoading(true);
          setShowLoading(true);
          await signIn(credentials.email, credentials.password);
          haptics.notification('success');
        } catch (error) {
          haptics.notification('error');
          setModalConfig({
            title: '❌ Erreur de connexion',
            message: 'Impossible de vous connecter avec la biométrie. Veuillez utiliser vos identifiants.',
            type: 'error',
            buttons: [{ text: 'OK', style: 'primary', onPress: () => setModalVisible(false) }],
          });
          setModalVisible(true);
          // Supprimer les credentials corrompus
          await BiometricAuthService.removeCredentials();
        } finally {
          setLoading(false);
          setShowLoading(false);
        }
      }
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

  const handleBiometricSetupAccept = async (): Promise<void> => {
    if (currentCredentials) {
      try {
        await BiometricAuthService.saveCredentials(
          currentCredentials.email,
          currentCredentials.password,
        );
        await BiometricAuthService.markBiometricSetupShown();
        setBiometricSetupVisible(false);
        setCurrentCredentials(null);

        setModalConfig({
          title: '✅ Biométrie activée',
          message: `${biometricType} a été configuré avec succès ! Vous pouvez maintenant vous connecter rapidement.`,
          type: 'success',
          buttons: [{ text: 'Parfait !', style: 'primary', onPress: () => setModalVisible(false) }],
        });
        setModalVisible(true);
      } catch (error) {
        console.error('Error setting up biometric:', error);
        setModalConfig({
          title: '❌ Erreur',
          message: 'Impossible de configurer la biométrie. Veuillez réessayer plus tard.',
          type: 'error',
          buttons: [{ text: 'OK', style: 'primary', onPress: () => setModalVisible(false) }],
        });
        setModalVisible(true);
      }
    }
  };

  const handleBiometricSetupDecline = (): void => {
    BiometricAuthService.markBiometricSetupShown();
    setBiometricSetupVisible(false);
    setCurrentCredentials(null);
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
    modalVisible,
    setModalVisible,
    modalConfig,
    biometricSetupVisible,
    setBiometricSetupVisible,
    handleBiometricSetupAccept,
    handleBiometricSetupDecline,
  };
}
