import { supabase } from '@/src/lib/supabase';

export interface IUserStats {
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  successRate: number;
  bestStreak: number;
  currentStreak: number;
  totalSessions: number;
  totalPoints: number;
  favoriteTheme: string;
  lastActivity: Date;
}

export interface IThemeStats {
  theme: string;
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
  averageTime: number;
  lastPlayed: Date;
}

export interface IProgressData {
  dailyProgress: {
    date: string;
    points: number;
    sessions: number;
  }[];
  themeDistribution: {
    theme: string;
    value: number;
    percentage: number;
  }[];
  activityHeatmap: {
    date: string;
    intensity: number; // 0-4
  }[];
  objectives: {
    daily: {
      current: number;
      target: number;
      completed: boolean;
    };
    weekly: {
      current: number;
      target: number;
      completed: boolean;
    };
  };
}

class StatsService {
  /**
   * Récupère les statistiques globales de l'utilisateur
   */
  async getUserStats(userId: string): Promise<IUserStats | null> {
    try {
      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_points, streak_days')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Récupérer les sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed');

      if (sessionsError) {
        throw sessionsError;
      }

      // Récupérer les stats par thème
      const { data: themeStats, error: themeError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId);

      if (themeError) {
        throw themeError;
      }

      // Calculer les statistiques globales
      let totalQuestions = 0;
      let correctAnswers = 0;
      let totalTime = 0;
      const _bestStreak = 0;

      sessions?.forEach(session => {
        const { config } = session;
        totalQuestions += config?.questionCount ?? 0;
        correctAnswers += Math.floor((session.score ?? 0) * (config?.questionCount ?? 0) / 100);

        if (session.started_at && session.ended_at) {
          const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
          totalTime += duration;
        }
      });

      // Trouver le thème favori
      let favoriteTheme = 'Mathématiques';
      let maxQuestions = 0;

      themeStats?.forEach(stat => {
        if (stat.total_questions > maxQuestions) {
          maxQuestions = stat.total_questions;
          favoriteTheme = stat.theme;
        }
      });

      // Dernière activité
      const lastSession = sessions?.sort((a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
      )[0];

      return {
        totalQuestions,
        correctAnswers,
        averageTime: totalQuestions > 0 ? totalTime / totalQuestions / 1000 : 0, // en secondes
        successRate: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        bestStreak: profile?.streak_days ?? 0,
        currentStreak: profile?.streak_days ?? 0,
        totalSessions: sessions?.length ?? 0,
        totalPoints: profile?.total_points ?? 0,
        favoriteTheme,
        lastActivity: lastSession ? new Date(lastSession.started_at) : new Date(),
      };
    } catch (_error) {

      return null;
    }
  }

  /**
   * Récupère les statistiques par thème
   */
  async getThemeStats(userId: string): Promise<IThemeStats[]> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return (data || []).map(stat => ({
        theme: stat.theme,
        totalQuestions: stat.total_questions,
        correctAnswers: stat.correct_answers,
        successRate: stat.total_questions > 0
          ? (stat.correct_answers / stat.total_questions) * 100
          : 0,
        averageTime: stat.avg_time_per_question ?? 0,
        lastPlayed: new Date(stat.last_updated),
      }));
    } catch (_error) {

      return [];
    }
  }

  /**
   * Récupère les données de progression
   */
  async getProgressData(userId: string, days = 30): Promise<IProgressData> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Récupérer les sessions sur la période
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('started_at, total_points_earned, config')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      if (error) {
        throw error;
      }

      // Construire les données de progression quotidienne
      const dailyData = new Map<string, { points: number; sessions: number }>();
      const themeCount = new Map<string, number>();

      sessions?.forEach(session => {
        const date = new Date(session.started_at).toISOString().split('T')[0];

        if (!dailyData.has(date)) {
          dailyData.set(date, { points: 0, sessions: 0 });
        }

        const daily = dailyData.get(date);
        if (daily) {
          daily.points += session.total_points_earned ?? 0;
          daily.sessions += 1;
        }

        // Compter les thèmes
        const { config } = session;
        config?.themes?.forEach((theme: string) => {
          themeCount.set(theme, (themeCount.get(theme) ?? 0) + 1);
        });
      });

      // Créer le tableau de progression quotidienne
      const dailyProgress = [];
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const data = dailyData.get(dateStr) ?? { points: 0, sessions: 0 };

        dailyProgress.unshift({
          date: dateStr,
          points: data.points,
          sessions: data.sessions,
        });
      }

      // Calculer la distribution par thème
      const totalThemeCount = Array.from(themeCount.values()).reduce((a, b) => a + b, 0);
      const themeDistribution = Array.from(themeCount.entries()).map(([theme, count]) => ({
        theme,
        value: count,
        percentage: totalThemeCount > 0 ? (count / totalThemeCount) * 100 : 0,
      }));

      // Créer la heatmap d'activité
      const activityHeatmap = dailyProgress.map(day => ({
        date: day.date,
        intensity: this.calculateIntensity(day.sessions),
      }));

      // Calculer les objectifs
      const today = new Date().toISOString().split('T')[0];
      const todayData = dailyData.get(today) ?? { points: 0, sessions: 0 };

      const weekSessions = Array.from(dailyData.values())
        .reduce((sum, day) => sum + day.sessions, 0);

      const objectives = {
        daily: {
          current: todayData.sessions,
          target: 3,
          completed: todayData.sessions >= 3,
        },
        weekly: {
          current: weekSessions,
          target: 15,
          completed: weekSessions >= 15,
        },
      };

      return {
        dailyProgress,
        themeDistribution,
        activityHeatmap,
        objectives,
      };
    } catch (_error) {

      return {
        dailyProgress: [],
        themeDistribution: [],
        activityHeatmap: [],
        objectives: {
          daily: { current: 0, target: 3, completed: false },
          weekly: { current: 0, target: 15, completed: false },
        },
      };
    }
  }

  /**
   * Calcule l'intensité pour la heatmap (0-4)
   */
  private calculateIntensity(sessions: number): number {
    if (sessions === 0) {return 0;}
    if (sessions === 1) {return 1;}
    if (sessions === 2) {return 2;}
    if (sessions <= 4) {return 3;}
    return 4;
  }

  /**
   * Met à jour les statistiques après une session
   */
  async updateStatsAfterSession(params: {
    userId: string;
    theme: string;
    correctAnswers: number;
    totalQuestions: number;
    averageTime: number;
  }): Promise<void> {
    const { userId, theme, correctAnswers, totalQuestions, averageTime } = params;
    try {
      // Récupérer les stats existantes
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('theme', theme)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingStats) {
        // Mettre à jour les stats existantes
        const newTotal = existingStats.total_questions + totalQuestions;
        const newCorrect = existingStats.correct_answers + correctAnswers;
        const newAvgTime =
          (existingStats.avg_time_per_question * existingStats.total_questions +
           averageTime * totalQuestions) / newTotal;

        await supabase
          .from('user_stats')
          .update({
            total_questions: newTotal,
            correct_answers: newCorrect,
            avg_time_per_question: newAvgTime,
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('theme', theme);
      } else {
        // Créer de nouvelles stats
        await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            theme,
            total_questions: totalQuestions,
            correct_answers: correctAnswers,
            avg_time_per_question: averageTime,
            last_updated: new Date().toISOString(),
          });
      }
    } catch (_error) {

    }
  }
}

export const statsService = new StatsService();
