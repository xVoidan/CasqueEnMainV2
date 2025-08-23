import { supabase } from '@/src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ISessionConfig {
  themes: any[];
  questionCount: number;
  timerEnabled: boolean;
  timerDuration: number | null;
  scoring: {
    correct: number;
    incorrect: number;
    skipped: number;
    partial: number;
  };
}

export interface ISessionAnswer {
  questionId: string;
  selectedAnswers: string[];
  timeSpent: number;
  isCorrect: boolean;
  isPartial?: boolean;
  isSkipped: boolean;
}

export interface ISession {
  id: string;
  userId?: string;
  config: ISessionConfig;
  answers: ISessionAnswer[];
  score: number;
  pointsEarned: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
}

const SESSION_STORAGE_KEY = '@CasqueEnMains:currentSession';
const SESSION_HISTORY_KEY = '@CasqueEnMains:sessionHistory';

class SessionService {
  /**
   * Créer une nouvelle session
   */
  async createSession(config: ISessionConfig, userId?: string): Promise<ISession> {
    const session: ISession = {
      id: this.generateSessionId(),
      userId,
      config,
      answers: [],
      score: 0,
      pointsEarned: 0,
      startedAt: new Date(),
      status: 'in_progress',
    };

    // Sauvegarder en local
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

    // Si utilisateur connecté, sauvegarder dans Supabase
    if (userId) {
      try {
        const { error } = await supabase
          .from('sessions')
          .insert({
            id: session.id,
            user_id: userId,
            config: config,
            started_at: session.startedAt,
            status: session.status,
          });

        if (error) {

        }
      } catch (_error) {

      }
    }

    return session;
  }

  /**
   * Récupérer la session en cours
   */
  async getCurrentSession(): Promise<ISession | null> {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      return null;
    } catch (_error) {

      return null;
    }
  }

  /**
   * Sauvegarder une réponse
   */
  async saveAnswer(
    sessionId: string,
    answer: ISessionAnswer,
  ): Promise<void> {
    try {
      // Récupérer la session
      const session = await this.getCurrentSession();
      if (!session || session.id !== sessionId) {
        throw new Error('Session not found');
      }

      // Ajouter la réponse
      session.answers.push(answer);

      // Sauvegarder localement
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

      // Si utilisateur connecté, sauvegarder dans Supabase
      if (session.userId) {
        try {
          await supabase
            .from('session_answers')
            .insert({
              session_id: sessionId,
              question_id: answer.questionId,
              selected_answers: answer.selectedAnswers,
              time_spent: answer.timeSpent,
              is_correct: answer.isCorrect,
              is_partial: answer.isPartial,
              is_skipped: answer.isSkipped,
            });
        } catch (_error) {

        }
      }
    } catch (_error) {

      throw error;
    }
  }

  /**
   * Terminer une session
   */
  async completeSession(
    sessionId: string,
    score: number,
    pointsEarned: number,
  ): Promise<ISession> {
    try {
      // Récupérer la session
      const session = await this.getCurrentSession();
      if (!session || session.id !== sessionId) {
        throw new Error('Session not found');
      }

      // Mettre à jour la session
      session.score = score;
      session.pointsEarned = pointsEarned;
      session.completedAt = new Date();
      session.status = 'completed';

      // Sauvegarder dans l'historique
      await this.saveToHistory(session);

      // Supprimer la session courante
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);

      // Si utilisateur connecté, mettre à jour dans Supabase
      if (session.userId) {
        try {
          await supabase
            .from('sessions')
            .update({
              score,
              points_earned: pointsEarned,
              completed_at: session.completedAt,
              status: session.status,
            })
            .eq('id', sessionId);

          // Mettre à jour les points de l'utilisateur
          await this.updateUserPoints(session.userId, pointsEarned);
        } catch (_error) {

        }
      }

      return session;
    } catch (_error) {

      throw error;
    }
  }

  /**
   * Abandonner une session
   */
  async abandonSession(sessionId: string): Promise<void> {
    try {
      const session = await this.getCurrentSession();
      if (!session || session.id !== sessionId) {
        return;
      }

      session.status = 'abandoned';
      session.completedAt = new Date();

      // Sauvegarder dans l'historique
      await this.saveToHistory(session);

      // Supprimer la session courante
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);

      // Si utilisateur connecté, mettre à jour dans Supabase
      if (session.userId) {
        try {
          await supabase
            .from('sessions')
            .update({
              status: 'abandoned',
              completed_at: session.completedAt,
            })
            .eq('id', sessionId);
        } catch (_error) {

        }
      }
    } catch (_error) {

    }
  }

  /**
   * Récupérer l'historique des sessions
   */
  async getSessionHistory(limit: number = 10): Promise<ISession[]> {
    try {
      const historyData = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
      if (historyData) {
        const history = JSON.parse(historyData) as ISession[];
        return history.slice(0, limit);
      }
      return [];
    } catch (_error) {

      return [];
    }
  }

  /**
   * Récupérer les statistiques des sessions
   */
  async getSessionStats(userId?: string): Promise<any> {
    if (!userId) {
      // Statistiques locales
      const history = await this.getSessionHistory(100);
      return this.calculateLocalStats(history);
    }

    try {
      // Récupérer depuis Supabase
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) {
        throw error;
      }

      return this.calculateStats(data || []);
    } catch (_error) {

      // Fallback sur les stats locales
      const history = await this.getSessionHistory(100);
      return this.calculateLocalStats(history);
    }
  }

  /**
   * Sauvegarder dans l'historique local
   */
  private async saveToHistory(session: ISession): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : [];

      // Ajouter la nouvelle session au début
      history.unshift(session);

      // Garder seulement les 50 dernières sessions
      const limitedHistory = history.slice(0, 50);

      await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (_error) {

    }
  }

  /**
   * Mettre à jour les points de l'utilisateur
   */
  private async updateUserPoints(userId: string, points: number): Promise<void> {
    try {
      // Récupérer les points actuels
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const currentPoints = profile?.total_points ?? 0;
      const newPoints = currentPoints + points;

      // Mettre à jour les points
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ total_points: newPoints })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }
    } catch (_error) {

    }
  }

  /**
   * Calculer les statistiques
   */
  private calculateStats(sessions: any[]): any {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        averageScore: 0,
        totalPoints: 0,
        averageTime: 0,
        bestScore: 0,
        successRate: 0,
      };
    }

    const totalSessions = sessions.length;
    const totalPoints = sessions.reduce((sum, s) => sum + (s.points_earned ?? 0), 0);
    const averageScore = sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / totalSessions;
    const bestScore = Math.max(...sessions.map(s => s.score ?? 0));

    // Calculer le temps moyen
    const sessionsWithTime = sessions.filter(s => s.started_at && s.completed_at);
    const averageTime = sessionsWithTime.length > 0
      ? sessionsWithTime.reduce((sum, s) => {
          const start = new Date(s.started_at).getTime();
          const end = new Date(s.completed_at).getTime();
          return sum + (end - start) / 1000; // en secondes
        }, 0) / sessionsWithTime.length
      : 0;

    const successRate = sessions.filter(s => (s.score ?? 0) >= 60).length / totalSessions * 100;

    return {
      totalSessions,
      averageScore,
      totalPoints,
      averageTime,
      bestScore,
      successRate,
    };
  }

  /**
   * Calculer les statistiques locales
   */
  private calculateLocalStats(sessions: ISession[]): any {
    return this.calculateStats(sessions.map(s => ({
      score: s.score,
      points_earned: s.pointsEarned,
      started_at: s.startedAt,
      completed_at: s.completedAt,
    })));
  }

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const sessionService = new SessionService();
