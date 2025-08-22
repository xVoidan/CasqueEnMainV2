import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = '@biometric_enabled';
const REMEMBER_ME_KEY = '@remember_me';
const SAVED_EMAIL_KEY = '@saved_email';
const SECURE_CREDENTIALS_KEY = 'secure_credentials';
const BIOMETRIC_SETUP_SHOWN_KEY = '@biometric_setup_shown';

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

  static async saveCredentials(email: string, password: string): Promise<void> {
    try {
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(SECURE_CREDENTIALS_KEY, credentials);
      await this.setBiometricEnabled(true);
    } catch (error) {

      throw error;
    }
  }

  static async getCredentials(): Promise<{ email: string; password: string } | null> {
    try {
      const credentials = await SecureStore.getItemAsync(SECURE_CREDENTIALS_KEY);
      if (credentials) {
        return JSON.parse(credentials);
      }
      return null;
    } catch (error) {

      return null;
    }
  }

  static async removeCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_CREDENTIALS_KEY);
      await this.setBiometricEnabled(false);
    } catch (error) {

    }
  }

  static async shouldShowBiometricSetup(): Promise<boolean> {
    try {
      const shown = await AsyncStorage.getItem(BIOMETRIC_SETUP_SHOWN_KEY);
      const biometricEnabled = await this.isBiometricEnabled();
      const biometricSupported = await this.isBiometricSupported();

      return !shown && !biometricEnabled && biometricSupported;
    } catch {
      return false;
    }
  }

  static async markBiometricSetupShown(): Promise<void> {
    await AsyncStorage.setItem(BIOMETRIC_SETUP_SHOWN_KEY, 'true');
  }

  static async resetBiometricSetupShown(): Promise<void> {
    await AsyncStorage.removeItem(BIOMETRIC_SETUP_SHOWN_KEY);
  }
}
