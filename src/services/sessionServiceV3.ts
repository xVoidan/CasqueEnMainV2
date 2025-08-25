import { supabase } from '@/src/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateUUID } from '@/src/utils/uuid';
import { convertAnswerIdsToUUID } from '@/src/utils/answerIdConverter';

// Imports des types depuis sessionServiceV2
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
  status: 'in_progress' | 'completed' | 'abandoned';
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
const RETRY_DELAY = 1000;

class SessionServiceV3 {
  private retryQueue: Map<string, any> = new Map();

  /**
   * Créer ou reprendre une session
   */
  async createOrResumeSession(
    config: ISessionConfig,
    userId?: string,
    sessionId?: string,
  ): Promise<ISession> {
    // Si on a un sessionId, c'est une reprise
    if (sessionId) {
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

      // Sauvegarder en local pour permettre saveAnswer de fonctionner
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      console.log('[SessionServiceV3] Session reprise et mise en cache local:', sessionId);

      // Créer/mettre à jour dans Supabase si utilisateur connecté
      if (userId) {
        this.saveSessionToSupabase(session, 0);
      }

      return session;
    }

    // Sinon, créer une nouvelle session
    return this.createSession(config, userId);
  }

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
    console.log('[SessionServiceV3] Session créée localement:', sessionId);

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
      console.warn('[SessionServiceV3] Max retry attempts reached for session:', session.id);
      this.retryQueue.set(session.id, session);
      return;
    }

    try {
      // Vérifier si nous avons une connexion internet
      const isOnline = await this.checkNetworkConnection();
      if (!isOnline) {
        console.warn('[SessionServiceV3] Pas de connexion réseau, mise en file d\'attente');
        this.retryQueue.set(session.id, session);
        return;
      }

      const { error } = await supabase
        .from('sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          config: session.config,
          started_at: session.startedAt.toISOString(),
          status: session.status,
          score: session.score,
          total_points_earned: Math.max(0, Math.round(session.pointsEarned || 0)),
        }, {
          onConflict: 'id',
        });

      if (error) {
        // Si c'est une erreur réseau, réessayer
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn(`[SessionServiceV3] Erreur réseau, tentative ${attemptNumber + 1}/${MAX_RETRY_ATTEMPTS}`);
          setTimeout(() => {
            this.saveSessionToSupabase(session, attemptNumber + 1);
          }, RETRY_DELAY * Math.pow(2, attemptNumber));
        } else {
          // Autre type d'erreur (ex: validation), ne pas réessayer
          console.error('[SessionServiceV3] Erreur non-réseau:', error);
        }
      } else {
        console.log('[SessionServiceV3] Session upserted dans Supabase:', session.id);
        this.retryQueue.delete(session.id);
      }
    } catch (error: any) {
      // Erreur réseau capturée
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn(`[SessionServiceV3] Erreur réseau capturée, tentative ${attemptNumber + 1}/${MAX_RETRY_ATTEMPTS}`);
        setTimeout(() => {
          this.saveSessionToSupabase(session, attemptNumber + 1);
        }, RETRY_DELAY * Math.pow(2, attemptNumber));
      } else {
        console.error('[SessionServiceV3] Erreur inattendue:', error);
      }
    }
  }

  /**
   * Vérifier la connexion réseau
   */
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      // Essayer de faire un ping simple à Supabase
      const response = await fetch('https://ucwgtiaebljfbvhokicf.supabase.co/rest/v1/', {
        method: 'HEAD',
        mode: 'no-cors',
      }).catch(() => null);
      return response !== null;
    } catch {
      return false;
    }
  }

  /**
   * Sauvegarder une réponse avec gestion de session reprise
   */
  async saveAnswer(
    sessionId: string,
    answer: ISessionAnswer,
    userId?: string,
  ): Promise<void> {
    try {
      // Récupérer la session locale
      let session = await this.getCurrentSession();

      // Si pas de session locale, sauvegarder directement dans Supabase
      if (!session || session.id !== sessionId) {
        console.log('[SessionServiceV3] Session non trouvée localement, sauvegarde directe dans Supabase');
        if (userId) {
          await this.saveAnswerToSupabase(sessionId, answer, 0);
          return;
        } else {
          // Créer une session minimale pour le cache local
          session = {
            id: sessionId,
            userId,
            config: {} as ISessionConfig,
            answers: [answer],
            score: 0,
            pointsEarned: 0,
            startedAt: new Date(),
            status: 'in_progress',
          };
          await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        }
      } else {
        // Ajouter la réponse à la session locale
        session.answers.push(answer);
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }

      // Si utilisateur connecté, sauvegarder dans Supabase
      if (userId) {
        this.saveAnswerToSupabase(sessionId, answer, 0);
      }
    } catch (error) {
      console.error('[SessionServiceV3] Erreur sauvegarde réponse:', error);
      // Ne pas propager l'erreur pour ne pas bloquer l'UX
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
      console.warn('[SessionServiceV3] Max retry attempts reached for answer');
      return;
    }

    try {
      // Vérifier la connexion réseau
      const isOnline = await this.checkNetworkConnection();
      if (!isOnline) {
        console.warn('[SessionServiceV3] Pas de connexion pour sauvegarder la réponse');
        return;
      }
      // Vérifier d'abord si la session existe dans Supabase
      const { data: sessionExists, error: checkError } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', sessionId)
        .single();

      if (checkError || !sessionExists) {
        console.log('[SessionServiceV3] Session n\'existe pas dans Supabase, création...');
        // Créer la session si elle n'existe pas
        const { error: createError } = await supabase
          .from('sessions')
          .insert({
            id: sessionId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            config: {},
          });

        if (createError) {
          if (createError.message?.includes('Network request failed') || createError.message?.includes('fetch')) {
            console.warn('[SessionServiceV3] Erreur réseau lors de la création session');
          } else if (createError.code !== '23505') {
            console.error('[SessionServiceV3] Erreur création session:', createError);
          }
          // Si on ne peut pas créer la session, on ne peut pas sauvegarder la réponse
          return;
        }
      }

      const convertedAnswerIds = convertAnswerIdsToUUID(answer.selectedAnswers);

      const { error } = await supabase
        .from('session_answers')
        .insert({
          session_id: sessionId,
          question_id: answer.questionId,
          selected_answers: convertedAnswerIds,
          time_taken: Math.round(answer.timeSpent),
          is_correct: answer.isCorrect,
          is_partial: answer.isPartial || false,
          points_earned: answer.pointsEarned || 0,
        });

      if (error && error.code !== '23505') { // Ignorer les doublons
        console.error(`[SessionServiceV3] Answer save attempt ${attemptNumber + 1} failed:`, error);
        setTimeout(() => {
          this.saveAnswerToSupabase(sessionId, answer, attemptNumber + 1);
        }, RETRY_DELAY * Math.pow(2, attemptNumber));
      } else if (!error) {
        console.log('[SessionServiceV3] Réponse sauvegardée dans Supabase');
      }
    } catch (error) {
      console.error('[SessionServiceV3] Network error saving answer:', error);
      setTimeout(() => {
        this.saveAnswerToSupabase(sessionId, answer, attemptNumber + 1);
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
    console.log('[SessionServiceV3] Session mise en pause sauvegardée localement');

    // Sauvegarder dans Supabase
    if (userId) {
      try {
        // Vérifier la connexion réseau
        const isOnline = await this.checkNetworkConnection();
        if (!isOnline) {
          console.warn('[SessionServiceV3] Pas de connexion pour sauvegarder la session pause dans le cloud');
          return;
        }
        const { data: existing } = await supabase
          .from('sessions')
          .select('id')
          .eq('id', sessionData.sessionId)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('sessions')
            .update({
              status: 'in_progress',
              paused_at: new Date().toISOString(),
              config: {
                ...sessionData.config,
                currentQuestionIndex: sessionData.currentQuestionIndex,
                totalQuestions: sessionData.totalQuestions,
                totalPoints: sessionData.totalPoints || 0,
                streak: Math.round(sessionData.streak || 0),
                questionsToReview: sessionData.questionsToReview,
              },
            })
            .eq('id', sessionData.sessionId);

          if (error) {
            if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
              console.warn('[SessionServiceV3] Erreur réseau lors de la mise à jour session pause');
            } else {
              console.error('[SessionServiceV3] Erreur mise à jour session pause:', error);
            }
          } else {
            console.log('[SessionServiceV3] Session pause synchronisée avec Supabase');
          }
        } else {
          // Utiliser UPSERT pour éviter les erreurs de clé dupliquée
          const { error } = await supabase
            .from('sessions')
            .upsert({
              id: sessionData.sessionId,
              user_id: userId,
              status: 'in_progress',
              paused_at: new Date().toISOString(),
              started_at: new Date().toISOString(),
              config: {
                ...sessionData.config,
                currentQuestionIndex: sessionData.currentQuestionIndex,
                totalQuestions: sessionData.totalQuestions,
                totalPoints: sessionData.totalPoints || 0,
                streak: Math.round(sessionData.streak || 0),
                questionsToReview: sessionData.questionsToReview,
              },
              score: 0,
              total_points_earned: Math.max(0, Math.round(sessionData.totalPoints || 0)), // Pas de valeurs négatives
            }, {
              onConflict: 'id', // Si l'ID existe déjà, mettre à jour
            });

          if (error) {
            if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
              console.warn('[SessionServiceV3] Erreur réseau lors de l\'upsert session pause');
            } else {
              console.error('[SessionServiceV3] Erreur upsert session pause:', error);
            }
          } else {
            console.log('[SessionServiceV3] Session pause upsert réussie');
          }
        }

        // Sauvegarder les réponses en batch
        if (sessionData.sessionAnswers.length > 0) {
          await this.saveAnswersBatch(sessionData.sessionId, sessionData.sessionAnswers);
        }
      } catch (error) {
        console.error('[SessionServiceV3] Erreur sync session pause:', error);
      }
    }
  }

  /**
   * Sauvegarder plusieurs réponses en batch
   */
  private async saveAnswersBatch(
    sessionId: string,
    answers: ISessionAnswer[],
  ): Promise<void> {
    if (!answers || answers.length === 0) return;

    try {
      // Vérifier la connexion réseau
      const isOnline = await this.checkNetworkConnection();
      if (!isOnline) {
        console.warn('[SessionServiceV3] Pas de connexion pour sauvegarder les réponses en batch');
        return;
      }

      // Filtrer les doublons
      const uniqueAnswers = answers.reduce((acc, answer) => {
        if (!acc.some(a => a.questionId === answer.questionId)) {
          acc.push(answer);
        }
        return acc;
      }, [] as ISessionAnswer[]);

      if (uniqueAnswers.length === 0) return;

      const { error } = await supabase
        .from('session_answers')
        .insert(
          uniqueAnswers.map(answer => ({
            session_id: sessionId,
            question_id: answer.questionId,
            selected_answers: convertAnswerIdsToUUID(answer.selectedAnswers),
            time_taken: Math.round(answer.timeSpent),
            is_correct: answer.isCorrect,
            is_partial: answer.isPartial || false,
            points_earned: answer.pointsEarned || 0,
          })),
        );

      if (error) {
        if (error.message?.includes('Network request failed') || error.message?.includes('fetch')) {
          console.warn('[SessionServiceV3] Erreur réseau lors de la sauvegarde batch');
        } else if (error.code !== '23505') {
          console.error('[SessionServiceV3] Erreur sauvegarde batch réponses:', error);
        }
      } else {
        console.log(`[SessionServiceV3] ${uniqueAnswers.length} réponses sauvegardées en batch`);
      }
    } catch (error: any) {
      if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
        console.warn('[SessionServiceV3] Erreur réseau capturée lors du batch save');
      } else {
        console.error('[SessionServiceV3] Erreur batch save:', error);
      }
    }
  }

  /**
   * Récupérer une session en pause
   */
  async getPausedSession(userId: string): Promise<IPausedSession | null> {
    const key = `${PAUSED_SESSION_KEY}_${userId}`;

    try {
      // Essayer le cloud d'abord
      const { data: cloudSession } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .not('paused_at', 'is', null)
        .order('paused_at', { ascending: false })
        .limit(1)
        .single();

      if (cloudSession && cloudSession.config) {
        console.log('[SessionServiceV3] Session pause récupérée depuis Supabase');

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
      // Pas de session cloud
    }

    // Fallback local
    try {
      const localData = await AsyncStorage.getItem(key);
      if (localData) {
        const parsed = JSON.parse(localData);
        const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);

        if (hoursSinceLastSave < 24) {
          console.log('[SessionServiceV3] Session pause récupérée localement');
          return parsed;
        } else {
          await this.clearPausedSession(userId);
        }
      }
    } catch (error) {
      console.error('[SessionServiceV3] Erreur récupération session locale:', error);
    }

    return null;
  }

  /**
   * Supprimer une session en pause
   */
  async clearPausedSession(userId: string): Promise<void> {
    const key = `${PAUSED_SESSION_KEY}_${userId}`;

    await AsyncStorage.removeItem(key);

    try {
      await supabase
        .from('sessions')
        .update({
          status: 'abandoned',
          ended_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'in_progress')
        .not('paused_at', 'is', null);

      console.log('[SessionServiceV3] Sessions en pause nettoyées');
    } catch (error) {
      console.error('[SessionServiceV3] Erreur nettoyage sessions cloud:', error);
    }
  }

  /**
   * Terminer une session
   */
  async completeSession(
    sessionId: string,
    score: number,
    pointsEarned: number,
    userId?: string,
  ): Promise<ISession> {
    try {
      const session = await this.getCurrentSession();

      if (session) {
        session.score = score;
        session.pointsEarned = pointsEarned;
        session.completedAt = new Date();
        session.status = 'completed';

        await this.saveToHistory(session);
      }

      await AsyncStorage.removeItem(SESSION_STORAGE_KEY);

      if (userId) {
        try {
          const { error } = await supabase
            .from('sessions')
            .update({
              score: Math.round(score * 100) / 100, // Garder 2 décimales
              total_points_earned: Math.max(0, Math.round(pointsEarned || 0)), // Pas de valeurs négatives
              completed_at: new Date().toISOString(),
              ended_at: new Date().toISOString(),
              status: 'completed',
            })
            .eq('id', sessionId);

          if (error) {
            console.error('[SessionServiceV3] Erreur finalisation session:', error);
          } else {
            console.log('[SessionServiceV3] Session finalisée dans Supabase');
            await this.updateUserPoints(userId, pointsEarned);
            await this.clearPausedSession(userId);
          }
        } catch (error) {
          console.error('[SessionServiceV3] Erreur réseau finalisation:', error);
        }
      }

      return session || {
        id: sessionId,
        userId,
        config: {} as ISessionConfig,
        answers: [],
        score,
        pointsEarned,
        startedAt: new Date(),
        completedAt: new Date(),
        status: 'completed',
      };
    } catch (error) {
      console.error('[SessionServiceV3] Erreur completion session:', error);
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
      console.error('[SessionServiceV3] Erreur récupération session:', error);
      return null;
    }
  }

  /**
   * Retry des opérations en échec
   */
  async retryFailedOperations(): Promise<void> {
    console.log(`[SessionServiceV3] Retrying ${this.retryQueue.size} failed operations`);

    for (const [key, data] of this.retryQueue.entries()) {
      if (key.startsWith('complete_')) {
        try {
          await supabase
            .from('sessions')
            .update({
              score: Math.round(data.score * 100) / 100,
              total_points_earned: Math.max(0, Math.round(data.pointsEarned || 0)), // Pas de valeurs négatives
              completed_at: data.completedAt,
              status: 'completed',
            })
            .eq('id', data.sessionId);

          this.retryQueue.delete(key);
        } catch (_error) {
          console.error('[SessionServiceV3] Retry failed for:', key);
        }
      } else {
        this.saveSessionToSupabase(data, 0);
      }
    }
  }

  private async saveToHistory(session: ISession): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : [];

      history.unshift(session);
      const limitedHistory = history.slice(0, 50);

      await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('[SessionServiceV3] Erreur sauvegarde historique:', error);
    }
  }

  private async updateUserPoints(userId: string, points: number): Promise<void> {
    try {
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('[SessionServiceV3] Erreur récupération profil:', fetchError);
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
        console.error('[SessionServiceV3] Erreur mise à jour points:', updateError);
      } else {
        console.log(`[SessionServiceV3] Points mis à jour: ${currentPoints} -> ${newPoints}`);
      }
    } catch (error) {
      console.error('[SessionServiceV3] Erreur mise à jour points:', error);
    }
  }

  private generateSessionId(): string {
    return generateUUID();
  }
}

export const sessionServiceV3 = new SessionServiceV3();
