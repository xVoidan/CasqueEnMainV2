import { supabase } from '@/src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUUID } from '@/src/utils/uuid';
import { convertAnswerIdsToUUID } from '@/src/utils/answerIdConverter';

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
  questionTypeFilter?: 'all' | 'single' | 'multiple';
}

export interface ISessionAnswer {
  questionId: string;
  selectedAnswers: string[];
  timeSpent: number;
  isCorrect: boolean;
  isPartial?: boolean;
  isSkipped: boolean;
  pointsEarned?: number;
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
  pausedAt?: Date;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  streak?: number;
  status: 'in_progress' | 'completed' | 'abandoned'; // 'paused' n'existe pas dans l'enum DB
}

export interface IPausedSession {
  sessionId: string;
  userId: string;
  config: ISessionConfig;
  currentQuestionIndex: number;
  totalQuestions: number;
  totalPoints: number;
  streak: number;
  questionsToReview: string[];
  sessionAnswers: ISessionAnswer[];
  timestamp: number;
}

const SESSION_STORAGE_KEY = '@CasqueEnMains:currentSession';
const SESSION_HISTORY_KEY = '@CasqueEnMains:sessionHistory';
const PAUSED_SESSION_KEY = '@training_session_progress';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 seconde

class SessionServiceV2 {
  private retryQueue: Map<string, any> = new Map();

  /**
   * Créer une nouvelle session avec retry automatique
   */
  async createSession(config: ISessionConfig, userId?: string): Promise<ISession> {
    const sessionId = this.generateSessionId();
    const session: ISession = {
      id: sessionId,
      userId,
      config,
      answers: [],
      score: 0,
      pointsEarned: 0,
      startedAt: new Date(),
      status: 'in_progress',
      currentQuestionIndex: 0,
      totalQuestions: config.questionCount > 0 ? config.questionCount : 999,
      streak: 0,
    };

    // Sauvegarder en local d'abord (toujours fonctionnel)
    await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    console.log('[SessionServiceV2] Session créée localement:', sessionId);

    // Si utilisateur connecté, sauvegarder dans Supabase avec retry
    if (userId) {
      this.saveSessionToSupabase(session, 0);
    }

    return session;
  }

  /**
   * Sauvegarder la session dans Supabase avec retry automatique
   */
  private async saveSessionToSupabase(session: ISession, attemptNumber: number): Promise<void> {
    if (attemptNumber >= MAX_RETRY_ATTEMPTS) {
      console.error('[SessionServiceV2] Max retry attempts reached for session:', session.id);
      // Stocker dans la queue pour retry ultérieur
      this.retryQueue.set(session.id, session);
      return;
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          id: session.id,
          user_id: session.userId,
          config: session.config,
          started_at: session.startedAt.toISOString(),
          status: session.status,
          score: session.score,
          total_points_earned: session.pointsEarned,
        });

      if (error) {
        console.error(`[SessionServiceV2] Attempt ${attemptNumber + 1} failed:`, error);
        // Retry après un délai
        setTimeout(() => {
          this.saveSessionToSupabase(session, attemptNumber + 1);
        }, RETRY_DELAY * Math.pow(2, attemptNumber)); // Exponential backoff
      } else {
        console.log('[SessionServiceV2] Session sauvegardée dans Supabase:', session.id);
        // Retirer de la queue si présent
        this.retryQueue.delete(session.id);
      }
    } catch (error) {
      console.error(`[SessionServiceV2] Network error attempt ${attemptNumber + 1}:`, error);
      setTimeout(() => {
        this.saveSessionToSupabase(session, attemptNumber + 1);
      }, RETRY_DELAY * Math.pow(2, attemptNumber));
    }
  }

  /**
   * Sauvegarder ou récupérer une session en pause (avec sync cloud)
   */
  async savePausedSession(
    sessionData: IPausedSession,
    userId: string,
  ): Promise<void> {
    const key = `${PAUSED_SESSION_KEY}_${userId}`;

    // Sauvegarder localement
    await AsyncStorage.setItem(key, JSON.stringify({
      ...sessionData,
      timestamp: Date.now(),
    }));
    console.log('[SessionServiceV2] Session mise en pause sauvegardée localement');

    // Sauvegarder dans Supabase
    if (userId) {
      try {
        // Vérifier si une session en pause existe déjà
        const { data: existing } = await supabase
          .from('sessions')
          .select('id')
          .eq('id', sessionData.sessionId)
          .single();

        if (existing) {
          // Mettre à jour la session existante
          const { error } = await supabase
            .from('sessions')
            .update({
              status: 'in_progress', // Utiliser 'in_progress' au lieu de 'paused'
              paused_at: new Date().toISOString(),
              config: {
                ...sessionData.config,
                currentQuestionIndex: sessionData.currentQuestionIndex,
                totalQuestions: sessionData.totalQuestions,
                totalPoints: sessionData.totalPoints,
                streak: sessionData.streak,
                questionsToReview: sessionData.questionsToReview,
              },
            })
            .eq('id', sessionData.sessionId);

          if (error) {
            console.error('[SessionServiceV2] Erreur mise à jour session pause:', error);
          } else {
            console.log('[SessionServiceV2] Session pause synchronisée avec Supabase');
          }
        } else {
          // Créer une nouvelle entrée
          const { error } = await supabase
            .from('sessions')
            .insert({
              id: sessionData.sessionId,
              user_id: userId,
              status: 'in_progress', // Utiliser 'in_progress' avec paused_at pour indiquer une pause
              paused_at: new Date().toISOString(),
              config: {
                ...sessionData.config,
                currentQuestionIndex: sessionData.currentQuestionIndex,
                totalQuestions: sessionData.totalQuestions,
                totalPoints: sessionData.totalPoints,
                streak: sessionData.streak,
                questionsToReview: sessionData.questionsToReview,
              },
              score: 0,
              total_points_earned: sessionData.totalPoints,
            });

          if (error) {
            console.error('[SessionServiceV2] Erreur création session pause:', error);
          }
        }

        // Sauvegarder les réponses existantes
        if (sessionData.sessionAnswers.length > 0) {
          await this.saveAnswersBatch(sessionData.sessionId, sessionData.sessionAnswers);
        }
      } catch (error) {
        console.error('[SessionServiceV2] Erreur sync session pause:', error);
      }
    }
  }

  /**
   * Récupérer une session en pause (local + cloud)
   */
  async getPausedSession(userId: string): Promise<IPausedSession | null> {
    const key = `${PAUSED_SESSION_KEY}_${userId}`;

    try {
      // Essayer de récupérer depuis le cloud d'abord
      const { data: cloudSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .not('paused_at', 'is', null) // Sessions en pause ont paused_at non null
        .order('paused_at', { ascending: false })
        .limit(1)
        .single();

      if (cloudSession && cloudSession.config) {
        console.log('[SessionServiceV2] Session pause récupérée depuis Supabase');

        // Récupérer les réponses associées
        const { data: answers } = await supabase
          .from('session_answers')
          .select('*')
          .eq('session_id', cloudSession.id);

        return {
          sessionId: cloudSession.id,
          userId: cloudSession.user_id,
          config: {
            themes: cloudSession.config.themes || [],
            questionCount: cloudSession.config.questionCount || -1,
            timerEnabled: cloudSession.config.timerEnabled || false,
            timerDuration: cloudSession.config.timerDuration || null,
            scoring: cloudSession.config.scoring || {
              correct: 1,
              incorrect: -0.5,
              skipped: -0.5,
              partial: 0.5,
            },
          },
          currentQuestionIndex: cloudSession.config.currentQuestionIndex || 0,
          totalQuestions: cloudSession.config.totalQuestions || 0,
          totalPoints: cloudSession.config.totalPoints || 0,
          streak: cloudSession.config.streak || 0,
          questionsToReview: cloudSession.config.questionsToReview || [],
          sessionAnswers: answers?.map(a => ({
            questionId: a.question_id,
            selectedAnswers: a.selected_answers || [],
            timeSpent: a.time_taken || 0,
            isCorrect: a.is_correct,
            isPartial: a.is_partial,
            isSkipped: false,
            pointsEarned: a.points_earned,
          })) || [],
          timestamp: new Date(cloudSession.paused_at).getTime(),
        };
      }
    } catch (_error) {
      // Pas de session cloud, vérification locale
    }

    // Fallback sur le stockage local
    try {
      const localData = await AsyncStorage.getItem(key);
      if (localData) {
        const parsed = JSON.parse(localData);
        const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);

        if (hoursSinceLastSave < 24) {
          console.log('[SessionServiceV2] Session pause récupérée localement');
          return parsed;
        } else {
          // Session trop ancienne, la supprimer
          await this.clearPausedSession(userId);
        }
      }
    } catch (error) {
      console.error('[SessionServiceV2] Erreur récupération session locale:', error);
    }

    return null;
  }

  /**
   * Supprimer une session en pause
   */
  async clearPausedSession(userId: string): Promise<void> {
    const key = `${PAUSED_SESSION_KEY}_${userId}`;

    // Supprimer localement
    await AsyncStorage.removeItem(key);

    // Supprimer ou marquer comme abandonnée dans Supabase
    try {
      await supabase
        .from('sessions')
        .update({
          status: 'abandoned',
          ended_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .not('paused_at', 'is', null); // Sessions qui étaient en pause

      console.log('[SessionServiceV2] Sessions en pause nettoyées');
    } catch (error) {
      console.error('[SessionServiceV2] Erreur nettoyage sessions cloud:', error);
    }
  }

  /**
   * Sauvegarder une réponse avec retry
   */
  async saveAnswer(
    sessionId: string,
    answer: ISessionAnswer,
    userId?: string,
  ): Promise<void> {
    try {
      // Récupérer la session locale
      const session = await this.getCurrentSession();

      // Si pas de session locale (cas de reprise), créer une session minimale
      if (!session || session.id !== sessionId) {
        // Pour une session reprise, on n'a pas besoin de toutes les données localement
        // On sauvegarde directement dans Supabase
        if (userId) {
          this.saveAnswerToSupabase(sessionId, answer, 0);
          return;
        } else {
          throw new Error('Session not found and no user ID provided');
        }
      }

      // Ajouter la réponse à la session locale
      session.answers.push(answer);

      // Sauvegarder localement
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));

      // Si utilisateur connecté, sauvegarder dans Supabase
      if (userId) {
        this.saveAnswerToSupabase(sessionId, answer, 0);
      }
    } catch (error) {
      console.error('[SessionServiceV2] Erreur sauvegarde réponse:', error);
      throw error;
    }
  }

  /**
   * Sauvegarder une réponse dans Supabase avec retry
   */
  private async saveAnswerToSupabase(
    sessionId: string,
    answer: ISessionAnswer,
    attemptNumber: number,
  ): Promise<void> {
    if (attemptNumber >= MAX_RETRY_ATTEMPTS) {
      console.error('[SessionServiceV2] Max retry attempts reached for answer');
      return;
    }

    try {
      // Convertir les IDs de réponses (a,b,c,d) en UUID factices
      const convertedAnswerIds = convertAnswerIdsToUUID(answer.selectedAnswers);

      const { error } = await supabase
        .from('session_answers')
        .insert({
          session_id: sessionId,
          question_id: answer.questionId,
          selected_answers: convertedAnswerIds,
          time_taken: Math.round(answer.timeSpent), // Arrondir en entier pour la DB
          is_correct: answer.isCorrect,
          is_partial: answer.isPartial || false,
          points_earned: answer.pointsEarned || 0,
        });

      if (error) {
        console.error(`[SessionServiceV2] Answer save attempt ${attemptNumber + 1} failed:`, error);
        setTimeout(() => {
          this.saveAnswerToSupabase(sessionId, answer, attemptNumber + 1);
        }, RETRY_DELAY * Math.pow(2, attemptNumber));
      } else {
        console.log('[SessionServiceV2] Réponse sauvegardée dans Supabase');
      }
    } catch (error) {
      console.error('[SessionServiceV2] Network error saving answer:', error);
      setTimeout(() => {
        this.saveAnswerToSupabase(sessionId, answer, attemptNumber + 1);
      }, RETRY_DELAY * Math.pow(2, attemptNumber));
    }
  }

  /**
   * Sauvegarder plusieurs réponses en batch
   */
  private async saveAnswersBatch(
    sessionId: string,
    answers: ISessionAnswer[],
  ): Promise<void> {
    if (answers.length === 0) return;

    try {
      // Filtrer les doublons par questionId
      const uniqueAnswers = answers.reduce((acc, answer) => {
        if (!acc.some(a => a.questionId === answer.questionId)) {
          acc.push(answer);
        }
        return acc;
      }, [] as ISessionAnswer[]);

      const { error } = await supabase
        .from('session_answers')
        .insert(
          uniqueAnswers.map(answer => ({
            session_id: sessionId,
            question_id: answer.questionId,
            selected_answers: convertAnswerIdsToUUID(answer.selectedAnswers),
            time_taken: Math.round(answer.timeSpent), // Arrondir en entier
            is_correct: answer.isCorrect,
            is_partial: answer.isPartial || false,
            points_earned: answer.pointsEarned || 0,
          })),
        );

      if (error && error.code !== '23505') { // Ignorer les erreurs de clé dupliquée
        console.error('[SessionServiceV2] Erreur sauvegarde batch réponses:', error);
      } else if (!error) {
        console.log(`[SessionServiceV2] ${uniqueAnswers.length} réponses sauvegardées en batch`);
      }
    } catch (error) {
      console.error('[SessionServiceV2] Erreur batch save:', error);
    }
  }

  /**
   * Terminer une session avec garantie de sauvegarde
   */
  async completeSession(
    sessionId: string,
    score: number,
    pointsEarned: number,
    userId?: string,
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

      // Sauvegarder dans l'historique local
      await this.saveToHistory(session);

      // Supprimer la session courante locale
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);

      // Si utilisateur connecté, finaliser dans Supabase
      if (userId) {
        try {
          const { error } = await supabase
            .from('sessions')
            .update({
              score,
              total_points_earned: pointsEarned,
              completed_at: session.completedAt.toISOString(),
              ended_at: session.completedAt.toISOString(),
              status: 'completed',
            })
            .eq('id', sessionId);

          if (error) {
            console.error('[SessionServiceV2] Erreur finalisation session:', error);
            // Ajouter à la queue de retry
            this.retryQueue.set(`complete_${sessionId}`, {
              sessionId,
              score,
              pointsEarned,
              completedAt: session.completedAt,
            });
          } else {
            console.log('[SessionServiceV2] Session finalisée dans Supabase');

            // Mettre à jour les points utilisateur
            await this.updateUserPoints(userId, pointsEarned);

            // Nettoyer la session en pause si elle existe
            await this.clearPausedSession(userId);
          }
        } catch (error) {
          console.error('[SessionServiceV2] Erreur réseau finalisation:', error);
        }
      }

      return session;
    } catch (error) {
      console.error('[SessionServiceV2] Erreur completion session:', error);
      throw error;
    }
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
    } catch (error) {
      console.error('[SessionServiceV2] Erreur récupération session:', error);
      return null;
    }
  }

  /**
   * Retry des opérations en échec
   */
  async retryFailedOperations(): Promise<void> {
    console.log(`[SessionServiceV2] Retrying ${this.retryQueue.size} failed operations`);

    for (const [key, data] of this.retryQueue.entries()) {
      if (key.startsWith('complete_')) {
        // Retry completion
        try {
          await supabase
            .from('sessions')
            .update({
              score: data.score,
              total_points_earned: data.pointsEarned,
              completed_at: data.completedAt,
              status: 'completed',
            })
            .eq('id', data.sessionId);

          this.retryQueue.delete(key);
        } catch (_error) {
          console.error('[SessionServiceV2] Retry failed for:', key);
        }
      } else {
        // Retry session creation
        this.saveSessionToSupabase(data, 0);
      }
    }
  }

  /**
   * Sauvegarder dans l'historique local
   */
  private async saveToHistory(session: ISession): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : [];

      history.unshift(session);
      const limitedHistory = history.slice(0, 50);

      await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('[SessionServiceV2] Erreur sauvegarde historique:', error);
    }
  }

  /**
   * Mettre à jour les points utilisateur
   */
  private async updateUserPoints(userId: string, points: number): Promise<void> {
    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('[SessionServiceV2] Erreur récupération profil:', fetchError);
        return;
      }

      const currentPoints = profile?.total_points ?? 0;
      const newPoints = Math.round(currentPoints + points);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_points: newPoints,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[SessionServiceV2] Erreur mise à jour points:', updateError);
      } else {
        console.log(`[SessionServiceV2] Points mis à jour: ${currentPoints} -> ${newPoints}`);
      }
    } catch (error) {
      console.error('[SessionServiceV2] Erreur mise à jour points:', error);
    }
  }

  /**
   * Générer un ID de session unique (UUID v4)
   */
  private generateSessionId(): string {
    return generateUUID();
  }
}

export const sessionServiceV2 = new SessionServiceV2();
