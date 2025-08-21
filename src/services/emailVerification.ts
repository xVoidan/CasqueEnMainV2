import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface IVerificationStatus {
  isVerified: boolean;
  emailSent: boolean;
  lastReminderAt?: number;
  reminderCount: number;
}

const VERIFICATION_STATUS_KEY = '@CasqueEnMain:emailVerification';
const REMINDER_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 days
const MAX_REMINDERS = 3;

export class EmailVerificationService {
  /**
   * Check if user email is verified
   */
  static async checkVerificationStatus(_userId: string): Promise<IVerificationStatus> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          isVerified: false,
          emailSent: false,
          reminderCount: 0,
        };
      }

      // Get stored status
      const storedStatus = await this.getStoredStatus();

      return {
        isVerified: user.email_confirmed_at !== null,
        emailSent: storedStatus?.emailSent ?? false,
        lastReminderAt: storedStatus?.lastReminderAt,
        reminderCount: storedStatus?.reminderCount ?? 0,
      };
    } catch {
      return {
        isVerified: false,
        emailSent: false,
        reminderCount: 0,
      };
    }
  }

  /**
   * Send verification email
   */
  static async sendVerificationEmail(email: string): Promise<boolean> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (!error) {
        await this.updateStoredStatus({
          emailSent: true,
          lastReminderAt: Date.now(),
          reminderCount: 1,
        });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if should show reminder
   */
  static async shouldShowReminder(): Promise<boolean> {
    const status = await this.getStoredStatus();

    if (!status || status.isVerified) {
      return false;
    }

    if (status.reminderCount >= MAX_REMINDERS) {
      return false;
    }

    if (!status.lastReminderAt) {
      return true;
    }

    return Date.now() - status.lastReminderAt > REMINDER_INTERVAL;
  }

  /**
   * Mark reminder as shown
   */
  static async markReminderShown(): Promise<void> {
    const status = await this.getStoredStatus();

    await this.updateStoredStatus({
      ...status,
      lastReminderAt: Date.now(),
      reminderCount: (status?.reminderCount ?? 0) + 1,
    });
  }

  /**
   * Get features available for unverified users
   */
  static getUnverifiedUserFeatures(): {
    canPlayQuiz: boolean;
    canViewRankings: boolean;
    canSaveProgress: boolean;
    canAccessDailyChallenges: boolean;
    canUnlockBadges: boolean;
    maxQuestionsPerDay: number;
  } {
    return {
      canPlayQuiz: true,
      canViewRankings: true,
      canSaveProgress: false, // Limited
      canAccessDailyChallenges: false,
      canUnlockBadges: false,
      maxQuestionsPerDay: 20, // Limited
    };
  }

  /**
   * Get stored verification status
   */
  private static async getStoredStatus(): Promise<IVerificationStatus | null> {
    try {
      const data = await AsyncStorage.getItem(VERIFICATION_STATUS_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Update stored verification status
   */
  private static async updateStoredStatus(status: Partial<IVerificationStatus>): Promise<void> {
    const current = await this.getStoredStatus();
    const updated = {
      ...current,
      ...status,
    };

    await AsyncStorage.setItem(VERIFICATION_STATUS_KEY, JSON.stringify(updated));
  }

  /**
   * Mark email as verified
   */
  static async markAsVerified(): Promise<void> {
    await this.updateStoredStatus({
      isVerified: true,
      emailSent: false,
      reminderCount: 0,
    });
  }

  /**
   * Clear verification status
   */
  static async clearStatus(): Promise<void> {
    await AsyncStorage.removeItem(VERIFICATION_STATUS_KEY);
  }
}
