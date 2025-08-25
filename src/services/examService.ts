import { supabase } from '@/src/lib/supabase';
import {
  Exam,
  ExamSession,
  ExamUserAnswer,
  ExamRanking,
  ExamStatistics,
  ExamWarning,
  ExamProblem,
  ExamQuestion,
} from '@/src/types/exam';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ExamService {
  private autoSaveInterval?: NodeJS.Timeout;
  private appStateSubscription?: any;
  private currentSession?: ExamSession;
  private blurCount = 0;
  private lastActivityTime = Date.now();
  private AUTOSAVE_INTERVAL = 30000; // 30 secondes
  private MIN_TIME_PER_QUESTION = 3; // 3 secondes minimum par question (anti-triche)

  /**
   * Récupère la liste des examens disponibles
   */
  async getAvailableExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        problems:exam_problems(
          *,
          questions:exam_questions(
            *,
            options:exam_question_options(*)
          )
        )
      `)
      .eq('is_active', true)
      .order('exam_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupère un examen spécifique avec toutes ses données
   */
  async getExamById(examId: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        problems:exam_problems(
          *,
          questions:exam_questions(
            *,
            options:exam_question_options(*)
          )
        )
      `)
      .eq('id', examId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Démarre une nouvelle session d'examen
   */
  async startExamSession(examId: string, userId: string): Promise<ExamSession> {
    // Vérifier s'il n'y a pas déjà une session en cours
    const { data: existingSession } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('exam_id', examId)
      .eq('status', 'in_progress')
      .single();

    if (existingSession) {
      throw new Error('Une session est déjà en cours pour cet examen');
    }

    // Créer une nouvelle session
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: userId,
        exam_id: examId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        app_blur_count: 0,
        integrity_score: 100,
        warnings: [],
      })
      .select()
      .single();

    if (error) throw error;

    this.currentSession = session;
    this.setupAutoSave();
    this.setupAppStateMonitoring();

    // Sauvegarder localement pour récupération en cas de crash
    await this.saveSessionLocally(session);

    return session;
  }

  /**
   * Configure la sauvegarde automatique
   */
  private setupAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = setInterval(async () => {
      if (this.currentSession?.status === 'in_progress') {
        await this.syncSession();
      }
    }, this.AUTOSAVE_INTERVAL);
  }

  /**
   * Configure la surveillance de l'état de l'application (anti-triche)
   */
  private setupAppStateMonitoring() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this),
    );
  }

  /**
   * Gère les changements d'état de l'application
   */
  private async handleAppStateChange(nextAppState: AppStateStatus) {
    if (!this.currentSession || this.currentSession.status !== 'in_progress') {
      return;
    }

    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.blurCount++;

      // Enregistrer l'avertissement
      const warning: ExamWarning = {
        type: 'APP_BLUR',
        message: `L'application a perdu le focus (${this.blurCount}e fois)`,
        timestamp: new Date().toISOString(),
        severity: this.blurCount > 3 ? 'high' : this.blurCount > 1 ? 'medium' : 'low',
      };

      await this.addWarning(warning);

      // Réduire le score d'intégrité
      if (this.currentSession) {
        this.currentSession.integrity_score = Math.max(
          0,
          this.currentSession.integrity_score - (this.blurCount * 5),
        );
        this.currentSession.app_blur_count = this.blurCount;
      }

      await this.syncSession();
    }
  }

  /**
   * Ajoute un avertissement à la session
   */
  private async addWarning(warning: ExamWarning) {
    if (!this.currentSession) return;

    const warnings = this.currentSession.warnings || [];
    warnings.push(`${warning.timestamp}: ${warning.type} - ${warning.message}`);

    const { error } = await supabase
      .from('exam_sessions')
      .update({
        warnings,
        integrity_score: this.currentSession.integrity_score,
        app_blur_count: this.blurCount,
      })
      .eq('id', this.currentSession.id);

    if (!error) {
      this.currentSession.warnings = warnings;
    }
  }

  /**
   * Soumet une réponse à une question
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedOptionId: string | null,
    timeSpent: number,
  ): Promise<void> {
    // Vérification anti-triche : temps minimum
    if (timeSpent < this.MIN_TIME_PER_QUESTION) {
      const warning: ExamWarning = {
        type: 'RAPID_ANSWERS',
        message: `Réponse trop rapide sur la question ${questionId} (${timeSpent}s)`,
        timestamp: new Date().toISOString(),
        severity: 'medium',
      };
      await this.addWarning(warning);
    }

    // Calculer les points
    let pointsEarned = 0;
    let isCorrect = false;

    if (selectedOptionId) {
      // Vérifier si la réponse est correcte
      const { data: option } = await supabase
        .from('exam_question_options')
        .select('is_correct')
        .eq('id', selectedOptionId)
        .single();

      if (option?.is_correct) {
        pointsEarned = 1; // +1 pour bonne réponse
        isCorrect = true;
      } else {
        pointsEarned = -0.5; // -0.5 pour mauvaise réponse
      }
    } else {
      pointsEarned = -0.5; // -0.5 pour absence de réponse
    }

    // Enregistrer la réponse
    const { error } = await supabase
      .from('exam_user_answers')
      .upsert({
        session_id: sessionId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        answered_at: new Date().toISOString(),
        time_spent_seconds: timeSpent,
      });

    if (error) throw error;

    // Mettre à jour l'activité
    this.lastActivityTime = Date.now();
    await this.updateLastActivity();
  }

  /**
   * Met à jour la dernière activité
   */
  private async updateLastActivity() {
    if (!this.currentSession) return;

    await supabase
      .from('exam_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', this.currentSession.id);
  }

  /**
   * Termine la session d'examen
   */
  async finishExamSession(sessionId: string): Promise<ExamSession> {
    // Calculer le score final
    const { data: answers } = await supabase
      .from('exam_user_answers')
      .select('points_earned')
      .eq('session_id', sessionId);

    const totalScore = answers?.reduce((sum, answer) => sum + (answer.points_earned || 0), 0) || 0;
    const duration = this.currentSession ?
      Math.floor((Date.now() - new Date(this.currentSession.started_at).getTime()) / 1000) : 0;

    // Mettre à jour la session
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .update({
        status: 'completed',
        score: totalScore,
        max_score: 20, // Maximum théorique
        percentage: (totalScore / 20) * 100,
        duration_seconds: duration,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;

    // Calculer et enregistrer le classement
    await this.calculateRanking(session);

    // Nettoyer
    this.cleanup();

    return session;
  }

  /**
   * Abandonne la session d'examen
   */
  async abandonExamSession(sessionId: string): Promise<void> {
    await supabase
      .from('exam_sessions')
      .update({
        status: 'abandoned',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    this.cleanup();
  }

  /**
   * Calcule et enregistre le classement
   */
  private async calculateRanking(session: ExamSession): Promise<void> {
    // Récupérer toutes les sessions terminées pour cet examen
    const { data: allSessions } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', session.exam_id)
      .eq('status', 'completed')
      .order('score', { ascending: false })
      .order('duration_seconds', { ascending: true });

    if (!allSessions) return;

    // Trouver la position
    const rank = allSessions.findIndex(s => s.id === session.id) + 1;
    const percentile = ((allSessions.length - rank) / allSessions.length) * 100;

    // Enregistrer le classement
    await supabase
      .from('exam_rankings')
      .upsert({
        exam_id: session.exam_id,
        user_id: session.user_id,
        session_id: session.id,
        rank,
        score: session.score || 0,
        duration_seconds: session.duration_seconds || 0,
        percentile,
      });
  }

  /**
   * Récupère les classements d'un examen
   */
  async getExamRankings(examId: string, limit = 100): Promise<ExamRanking[]> {
    const { data, error } = await supabase
      .from('exam_rankings')
      .select(`
        *,
        user:profiles(
          first_name,
          last_name,
          department
        )
      `)
      .eq('exam_id', examId)
      .order('rank', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupère les statistiques d'un examen
   */
  async getExamStatistics(examId: string): Promise<ExamStatistics> {
    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('status', 'completed');

    if (!sessions || sessions.length === 0) {
      return {
        total_participants: 0,
        average_score: 0,
        median_score: 0,
        pass_rate: 0,
        average_duration_minutes: 0,
        difficulty_index: 0,
        score_distribution: [],
        problem_statistics: [],
      };
    }

    const scores = sessions.map(s => s.score || 0).sort((a, b) => a - b);
    const durations = sessions.map(s => s.duration_seconds || 0);

    return {
      total_participants: sessions.length,
      average_score: scores.reduce((a, b) => a + b, 0) / scores.length,
      median_score: scores[Math.floor(scores.length / 2)],
      pass_rate: (scores.filter(s => s >= 10).length / scores.length) * 100,
      average_duration_minutes: durations.reduce((a, b) => a + b, 0) / durations.length / 60,
      difficulty_index: 1 - (scores.reduce((a, b) => a + b, 0) / (scores.length * 20)),
      score_distribution: this.calculateDistribution(scores),
      problem_statistics: await this.calculateProblemStats(examId),
    };
  }

  /**
   * Calcule la distribution des scores
   */
  private calculateDistribution(scores: number[]): ExamStatistics['score_distribution'] {
    const ranges = [
      { min: 0, max: 5, label: '0-5' },
      { min: 5, max: 10, label: '5-10' },
      { min: 10, max: 15, label: '10-15' },
      { min: 15, max: 20, label: '15-20' },
    ];

    return ranges.map(range => {
      const count = scores.filter(s => s >= range.min && s < range.max).length;
      return {
        range: range.label,
        count,
        percentage: (count / scores.length) * 100,
      };
    });
  }

  /**
   * Calcule les statistiques par problème
   */
  private async calculateProblemStats(examId: string): Promise<ExamStatistics['problem_statistics']> {
    const { data } = await supabase
      .from('exam_problems')
      .select(`
        id,
        title,
        questions:exam_questions(
          id,
          answers:exam_user_answers(
            is_correct,
            points_earned
          )
        )
      `)
      .eq('exam_id', examId);

    if (!data) return [];

    return data.map(problem => {
      const allAnswers = problem.questions?.flatMap(q => q.answers || []) || [];
      const correctAnswers = allAnswers.filter(a => a.is_correct).length;
      const totalPoints = allAnswers.reduce((sum, a) => sum + (a.points_earned || 0), 0);

      return {
        problem_id: problem.id,
        problem_title: problem.title,
        success_rate: allAnswers.length > 0 ? (correctAnswers / allAnswers.length) * 100 : 0,
        average_points: allAnswers.length > 0 ? totalPoints / allAnswers.length : 0,
      };
    });
  }

  /**
   * Synchronise la session avec le serveur
   */
  private async syncSession(): Promise<void> {
    if (!this.currentSession) return;

    await supabase
      .from('exam_sessions')
      .update({
        last_activity_at: new Date().toISOString(),
        app_blur_count: this.blurCount,
        integrity_score: this.currentSession.integrity_score,
      })
      .eq('id', this.currentSession.id);

    await this.saveSessionLocally(this.currentSession);
  }

  /**
   * Sauvegarde la session localement
   */
  private async saveSessionLocally(session: ExamSession): Promise<void> {
    await AsyncStorage.setItem(
      `exam_session_${session.id}`,
      JSON.stringify(session),
    );
  }

  /**
   * Récupère une session sauvegardée localement
   */
  async recoverSession(sessionId: string): Promise<ExamSession | null> {
    try {
      const savedSession = await AsyncStorage.getItem(`exam_session_${sessionId}`);
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
    }
    return null;
  }

  /**
   * Nettoie les ressources
   */
  private cleanup() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = undefined;
    }

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = undefined;
    }

    this.currentSession = undefined;
    this.blurCount = 0;
  }

  /**
   * Récupère le classement global (tous examens confondus)
   */
  async getGlobalRanking(userId: string): Promise<{rank: number, total: number}> {
    const { data: allRankings } = await supabase
      .from('exam_rankings')
      .select('user_id, score')
      .order('score', { ascending: false });

    if (!allRankings) return { rank: 0, total: 0 };

    // Grouper par utilisateur et prendre le meilleur score
    const userBestScores = new Map<string, number>();
    allRankings.forEach(r => {
      const current = userBestScores.get(r.user_id) || 0;
      userBestScores.set(r.user_id, Math.max(current, r.score));
    });

    // Trier et trouver le rang
    const sorted = Array.from(userBestScores.entries())
      .sort((a, b) => b[1] - a[1]);

    const rank = sorted.findIndex(([uid]) => uid === userId) + 1;

    return {
      rank: rank || sorted.length + 1,
      total: sorted.length,
    };
  }

  /**
   * Mode révision : refaire une annale sans contraintes
   */
  async startRevisionMode(examId: string, userId: string): Promise<ExamSession> {
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .insert({
        user_id: userId,
        exam_id: examId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        app_blur_count: 0,
        integrity_score: 100,
        warnings: ['MODE_REVISION'], // Marquer comme révision
      })
      .select()
      .single();

    if (error) throw error;
    return session;
  }
}

export const examService = new ExamService();
