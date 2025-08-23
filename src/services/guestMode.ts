import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/lib/supabase';

interface IGuestSession {
  id: string;
  sessionCount: number;
  createdAt: number;
  lastActiveAt: number;
  progress: {
    questionsAnswered: number;
    correctAnswers: number;
    totalPoints: number;
    completedSessions: string[];
  };
}

const GUEST_SESSION_KEY = '@CasqueEnMains:guestSession';
const GUEST_CONVERSION_PROMPT_KEY = '@CasqueEnMains:guestConversionPrompt';
const SESSIONS_BEFORE_PROMPT = 3;

export class GuestModeService {
  /**
   * Initialize guest session
   */
  static async initializeGuestSession(): Promise<IGuestSession> {
    const existingSession = await this.getGuestSession();

    if (existingSession) {
      // Update session count and last active
      existingSession.sessionCount++;
      existingSession.lastActiveAt = Date.now();
      await this.saveGuestSession(existingSession);
      return existingSession;
    }

    // Create new guest session
    const newSession: IGuestSession = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionCount: 1,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      progress: {
        questionsAnswered: 0,
        correctAnswers: 0,
        totalPoints: 0,
        completedSessions: [],
      },
    };

    await this.saveGuestSession(newSession);
    return newSession;
  }

  /**
   * Get current guest session
   */
  static async getGuestSession(): Promise<IGuestSession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(GUEST_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save guest session
   */
  static async saveGuestSession(session: IGuestSession): Promise<void> {
    await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));

    // Check if should prompt for conversion
    if (session.sessionCount >= SESSIONS_BEFORE_PROMPT) {
      await this.markForConversionPrompt();
    }
  }

  /**
   * Update guest progress
   */
  static async updateGuestProgress(update: {
    questionsAnswered?: number;
    correctAnswers?: number;
    points?: number;
    sessionId?: string;
  }): Promise<void> {
    const session = await this.getGuestSession();
    if (!session) {return;}

    if (update.questionsAnswered) {
      session.progress.questionsAnswered += update.questionsAnswered;
    }
    if (update.correctAnswers) {
      session.progress.correctAnswers += update.correctAnswers;
    }
    if (update.points) {
      session.progress.totalPoints += update.points;
    }
    if (update.sessionId && !session.progress.completedSessions.includes(update.sessionId)) {
      session.progress.completedSessions.push(update.sessionId);
    }

    session.lastActiveAt = Date.now();
    await this.saveGuestSession(session);
  }

  /**
   * Check if should show conversion prompt
   */
  static async shouldShowConversionPrompt(): Promise<boolean> {
    const session = await this.getGuestSession();
    if (!session || session.sessionCount < SESSIONS_BEFORE_PROMPT) {
      return false;
    }

    const lastPrompt = await AsyncStorage.getItem(GUEST_CONVERSION_PROMPT_KEY);
    if (!lastPrompt) {return true;}

    // Don't show more than once per day
    const lastPromptTime = parseInt(lastPrompt, 10);
    return Date.now() - lastPromptTime > 86400000; // 24 hours
  }

  /**
   * Mark that conversion prompt was shown
   */
  static async markConversionPromptShown(): Promise<void> {
    await AsyncStorage.setItem(GUEST_CONVERSION_PROMPT_KEY, Date.now().toString());
  }

  /**
   * Mark for conversion prompt
   */
  private static async markForConversionPrompt(): Promise<void> {
    const lastPrompt = await AsyncStorage.getItem(GUEST_CONVERSION_PROMPT_KEY);
    if (!lastPrompt) {
      // First time reaching threshold, don't mark as shown yet
      return;
    }
  }

  /**
   * Convert guest to registered user
   */
  static async convertGuestToUser(userId: string): Promise<boolean> {
    try {
      const guestSession = await this.getGuestSession();
      if (!guestSession) {return false;}

      // Transfer progress to user profile
      const { error } = await supabase
        .from('profiles')
        .update({
          total_points: guestSession.progress.totalPoints,
        })
        .eq('user_id', userId);

      if (error) {

        return false;
      }

      // Create user stats entry
      await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          theme: 'Mathématiques',
          total_questions: guestSession.progress.questionsAnswered,
          correct_answers: guestSession.progress.correctAnswers,
        });

      // Clear guest session
      await this.clearGuestSession();
      return true;
    } catch (_error) {

      return false;
    }
  }

  /**
   * Clear guest session
   */
  static async clearGuestSession(): Promise<void> {
    await AsyncStorage.multiRemove([GUEST_SESSION_KEY, GUEST_CONVERSION_PROMPT_KEY]);
  }

  /**
   * Get guest stats for display
   */
  static async getGuestStats(): Promise<{
    accuracy: number;
    totalPoints: number;
    sessionsCompleted: number;
    daysActive: number;
  }> {
    const session = await this.getGuestSession();
    if (!session) {
      return {
        accuracy: 0,
        totalPoints: 0,
        sessionsCompleted: 0,
        daysActive: 0,
      };
    }

    const accuracy = session.progress.questionsAnswered > 0
      ? (session.progress.correctAnswers / session.progress.questionsAnswered) * 100
      : 0;

    const daysActive = Math.ceil(
      (Date.now() - session.createdAt) / (1000 * 60 * 60 * 24),
    );

    return {
      accuracy: Math.round(accuracy),
      totalPoints: session.progress.totalPoints,
      sessionsCompleted: session.progress.completedSessions.length,
      daysActive,
    };
  }
}
