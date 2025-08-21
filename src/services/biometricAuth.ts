import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const REMEMBER_ME_KEY = '@remember_me';
const SAVED_EMAIL_KEY = '@saved_email';

export class BiometricAuthService {
  static async isBiometricSupported(): Promise<boolean> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  static async getBiometricType(): Promise<string> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    return 'Biométrie';
  }

  static async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage ?? 'Authentifiez-vous pour continuer',
        fallbackLabel: 'Utiliser le mot de passe',
        cancelLabel: 'Annuler',
      });
      return result.success;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  static async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
  }

  static async isBiometricEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return value ? JSON.parse(value) : false;
    } catch {
      return false;
    }
  }

  static async setRememberMe(remember: boolean, email?: string): Promise<void> {
    await AsyncStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(remember));
    if (remember && email) {
      await AsyncStorage.setItem(SAVED_EMAIL_KEY, email);
    } else {
      await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
    }
  }

  static async getRememberedEmail(): Promise<{ rememberMe: boolean; email: string | null }> {
    try {
      const rememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      const email = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
      return {
        rememberMe: rememberMe ? JSON.parse(rememberMe) : false,
        email: email ?? null,
      };
    } catch {
      return { rememberMe: false, email: null };
    }
  }
}
