import { supabase } from '@/src/lib/supabase';
import { getCurrentGrade } from '@/src/utils/grades';

export interface IRankingEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  points: number;
  grade: ReturnType<typeof getCurrentGrade>;
  evolution?: number; // Changement de position
  department?: string;
}

export interface IRankingData {
  global: IRankingEntry[];
  weekly: IRankingEntry[];
  monthly: IRankingEntry[];
  byTheme: Record<string, IRankingEntry[]>;
  myPosition?: {
    global: number;
    weekly: number;
    monthly: number;
  };
}

class RankingService {
  /**
   * Récupère les classements
   */
  async getRankings(userId?: string): Promise<IRankingData> {
    try {
      // Récupérer tous les profils triés par points
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, total_points, department, current_grade')
        .order('total_points', { ascending: false });

      if (error) {
        throw error;
      }

      if (!profiles) {
        return {
          global: [],
          weekly: [],
          monthly: [],
          byTheme: {},
        };
      }

      // Créer le classement global
      const globalRanking: IRankingEntry[] = profiles.map((profile, index) => ({
        rank: index + 1,
        user_id: profile.user_id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        points: profile.total_points,
        grade: getCurrentGrade(profile.total_points),
        department: profile.department,
        evolution: 0, // TODO: Calculer l'évolution
      }));

      // Récupérer les classements hebdomadaires
      const weeklyRanking = await this.getWeeklyRanking();

      // Récupérer les classements mensuels
      const monthlyRanking = await this.getMonthlyRanking();

      // Récupérer les classements par thème
      const byTheme = await this.getRankingsByTheme();

      // Trouver ma position si userId est fourni
      let myPosition;
      if (userId) {
        const globalPos = globalRanking.findIndex(r => r.user_id === userId) + 1;
        const weeklyPos = weeklyRanking.findIndex(r => r.user_id === userId) + 1;
        const monthlyPos = monthlyRanking.findIndex(r => r.user_id === userId) + 1;

        myPosition = {
          global: globalPos || 0,
          weekly: weeklyPos || 0,
          monthly: monthlyPos || 0,
        };
      }

      return {
        global: globalRanking,
        weekly: weeklyRanking,
        monthly: monthlyRanking,
        byTheme,
        myPosition,
      };
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return {
        global: [],
        weekly: [],
        monthly: [],
        byTheme: {},
      };
    }
  }

  /**
   * Récupère le classement hebdomadaire
   */
  private async getWeeklyRanking(): Promise<IRankingEntry[]> {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          user_id,
          total_points_earned,
          profiles!inner (username, avatar_url, department, current_grade)
        `)
        .gte('started_at', startOfWeek.toISOString())
        .eq('status', 'completed');

      if (error) {
        throw error;
      }

      // Agréger les points par utilisateur
      const userPoints = new Map<string, any>();

      data?.forEach(session => {
        const userId = session.user_id;
        if (!userPoints.has(userId)) {
          userPoints.set(userId, {
            user_id: userId,
            username: session.profiles.username,
            avatar_url: session.profiles.avatar_url,
            department: session.profiles.department,
            points: 0,
          });
        }
        const user = userPoints.get(userId);
        user.points += session.total_points_earned || 0;
      });

      // Convertir en tableau et trier
      return Array.from(userPoints.values())
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({
          rank: index + 1,
          ...user,
          grade: getCurrentGrade(user.points),
          evolution: 0,
        }));
    } catch (error) {
      console.error('Error fetching weekly ranking:', error);
      return [];
    }
  }

  /**
   * Récupère le classement mensuel
   */
  private async getMonthlyRanking(): Promise<IRankingEntry[]> {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          user_id,
          total_points_earned,
          profiles!inner (username, avatar_url, department, current_grade)
        `)
        .gte('started_at', startOfMonth.toISOString())
        .eq('status', 'completed');

      if (error) {
        throw error;
      }

      // Agréger les points par utilisateur
      const userPoints = new Map<string, any>();

      data?.forEach(session => {
        const userId = session.user_id;
        if (!userPoints.has(userId)) {
          userPoints.set(userId, {
            user_id: userId,
            username: session.profiles.username,
            avatar_url: session.profiles.avatar_url,
            department: session.profiles.department,
            points: 0,
          });
        }
        const user = userPoints.get(userId);
        user.points += session.total_points_earned || 0;
      });

      // Convertir en tableau et trier
      return Array.from(userPoints.values())
        .sort((a, b) => b.points - a.points)
        .map((user, index) => ({
          rank: index + 1,
          ...user,
          grade: getCurrentGrade(user.points),
          evolution: 0,
        }));
    } catch (error) {
      console.error('Error fetching monthly ranking:', error);
      return [];
    }
  }

  /**
   * Récupère les classements par thème
   */
  private async getRankingsByTheme(): Promise<Record<string, IRankingEntry[]>> {
    try {
      const themes = ['Mathématiques', 'Français', 'Métier'];
      const rankingsByTheme: Record<string, IRankingEntry[]> = {};

      for (const theme of themes) {
        const { data, error } = await supabase
          .from('user_stats')
          .select(`
            user_id,
            correct_answers,
            total_questions,
            profiles!inner (username, avatar_url, department, total_points)
          `)
          .eq('theme', theme)
          .order('correct_answers', { ascending: false });

        if (!error && data) {
          rankingsByTheme[theme] = data
            .map((stat, index) => ({
              rank: index + 1,
              user_id: stat.user_id,
              username: stat.profiles.username,
              avatar_url: stat.profiles.avatar_url,
              points: stat.correct_answers,
              grade: getCurrentGrade(stat.profiles.total_points),
              department: stat.profiles.department,
              evolution: 0,
            }));
        }
      }

      return rankingsByTheme;
    } catch (error) {
      console.error('Error fetching theme rankings:', error);
      return {};
    }
  }

  /**
   * Recherche un joueur dans le classement
   */
  async searchPlayer(username: string): Promise<IRankingEntry[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url, total_points, department, current_grade')
        .ilike('username', `%${username}%`)
        .limit(10);

      if (error) {
        throw error;
      }

      return (data || []).map((profile, index) => ({
        rank: 0, // Sera calculé dans le contexte global
        user_id: profile.user_id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        points: profile.total_points,
        grade: getCurrentGrade(profile.total_points),
        department: profile.department,
      }));
    } catch (error) {
      console.error('Error searching player:', error);
      return [];
    }
  }

  /**
   * Met à jour le classement d'un utilisateur après une session
   */
  async updateUserRanking(userId: string, pointsEarned: number): Promise<void> {
    try {
      // Mettre à jour les points totaux
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      const newTotalPoints = (profile?.total_points || 0) + pointsEarned;

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_points: newTotalPoints,
          current_grade: getCurrentGrade(newTotalPoints).id,
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }

      // TODO: Mettre à jour les classements en cache si nécessaire
    } catch (error) {
      console.error('Error updating user ranking:', error);
    }
  }
}

export const rankingService = new RankingService();
