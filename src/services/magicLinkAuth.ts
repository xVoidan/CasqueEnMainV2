import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface IMagicLinkResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface IOTPVerificationResponse {
  success: boolean;
  session?: any;
  error?: string;
}

const MAGIC_LINK_KEY = '@CasqueEnMains:pendingMagicLink';
const OTP_ATTEMPTS_KEY = '@CasqueEnMains:otpAttempts';
const MAX_OTP_ATTEMPTS = 3;
const OTP_EXPIRY = 600000; // 10 minutes

export class MagicLinkAuthService {
  /**
   * Send a magic link to the user's email
   */
  static async sendMagicLink(email: string): Promise<IMagicLinkResponse> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'casqueenmain://auth/confirm',
          shouldCreateUser: false,
        },
      });

      if (error) {
        return {
          success: false,
          message: "Erreur lors de l'envoi du lien",
          error: error.message,
        };
      }

      // Store pending magic link email
      await AsyncStorage.setItem(
        MAGIC_LINK_KEY,
        JSON.stringify({
          email,
          timestamp: Date.now(),
        }),
      );

      return {
        success: true,
        message: 'Un lien de connexion a été envoyé à votre email',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Une erreur est survenue',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Send OTP code to email
   */
  static async sendOTPCode(email: string): Promise<IMagicLinkResponse> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        return {
          success: false,
          message: "Erreur lors de l'envoi du code",
          error: error.message,
        };
      }

      // Reset OTP attempts
      await AsyncStorage.setItem(
        OTP_ATTEMPTS_KEY,
        JSON.stringify({
          email,
          attempts: 0,
          timestamp: Date.now(),
        }),
      );

      return {
        success: true,
        message: 'Un code de vérification a été envoyé à votre email',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Une erreur est survenue',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(email: string, token: string): Promise<IOTPVerificationResponse> {
    try {
      // Check OTP attempts
      const attemptsData = await AsyncStorage.getItem(OTP_ATTEMPTS_KEY);
      if (attemptsData) {
        const attempts = JSON.parse(attemptsData);

        // Check if OTP expired
        if (Date.now() - attempts.timestamp > OTP_EXPIRY) {
          await AsyncStorage.removeItem(OTP_ATTEMPTS_KEY);
          return {
            success: false,
            error: 'Le code a expiré. Veuillez en demander un nouveau.',
          };
        }

        // Check max attempts
        if (attempts.attempts >= MAX_OTP_ATTEMPTS) {
          return {
            success: false,
            error: 'Trop de tentatives. Veuillez demander un nouveau code.',
          };
        }

        // Increment attempts
        attempts.attempts++;
        await AsyncStorage.setItem(OTP_ATTEMPTS_KEY, JSON.stringify(attempts));
      }

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Clear attempts on success
      await AsyncStorage.removeItem(OTP_ATTEMPTS_KEY);
      await AsyncStorage.removeItem(MAGIC_LINK_KEY);

      return {
        success: true,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check if there's a pending magic link
   */
  static async getPendingMagicLink(): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(MAGIC_LINK_KEY);
      if (!data) {return null;}

      const { email, timestamp } = JSON.parse(data);

      // Check if magic link expired (24 hours)
      if (Date.now() - timestamp > 86400000) {
        await AsyncStorage.removeItem(MAGIC_LINK_KEY);
        return null;
      }

      return email;
    } catch {
      return null;
    }
  }

  /**
   * Clear pending magic link
   */
  static async clearPendingMagicLink(): Promise<void> {
    await AsyncStorage.removeItem(MAGIC_LINK_KEY);
  }

  /**
   * Resend OTP code with rate limiting
   */
  static async resendOTP(email: string): Promise<IMagicLinkResponse> {
    const attemptsData = await AsyncStorage.getItem(OTP_ATTEMPTS_KEY);
    if (attemptsData) {
      const attempts = JSON.parse(attemptsData);

      // Rate limit: 1 minute between resends
      if (Date.now() - attempts.timestamp < 60000) {
        const remainingTime = Math.ceil((60000 - (Date.now() - attempts.timestamp)) / 1000);
        return {
          success: false,
          message: `Veuillez attendre ${remainingTime} secondes avant de renvoyer`,
          error: 'RATE_LIMIT',
        };
      }
    }

    return this.sendOTPCode(email);
  }
}
