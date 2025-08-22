import { supabase } from '@/src/lib/supabase';

export interface IUserProfile {
  user_id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  department?: string;
  total_points: number;
  current_grade: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export interface IUserStats {
  user_id: string;
  theme: string;
  total_questions: number;
  correct_answers: number;
  avg_time_per_question: number;
  last_updated: string;
}

export interface ISession {
  id: string;
  user_id: string;
  config: any;
  started_at: string;
  ended_at?: string;
  score?: number;
  total_points_earned?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
}

export interface IDailyChallenge {
  id: string;
  date: string;
  theme: string;
  questions_ids: string[];
  reward_points: number;
}

export interface IUserChallenge {
  user_id: string;
  challenge_id: string;
  completed_at?: string;
  points_earned?: number;
}

class UserService {
  async getUserProfile(userId: string): Promise<IUserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {throw error;}
      return data;
    } catch (error) {

      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<IUserProfile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId);

      if (error) {throw error;}
      return true;
    } catch (error) {

      return false;
    }
  }

  async getUserStats(userId: string): Promise<IUserStats[]> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId);

      if (error) {throw error;}
      return data || [];
    } catch (error) {

      return [];
    }
  }

  async getUserSessions(userId: string, limit = 10): Promise<ISession[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {throw error;}
      return data || [];
    } catch (error) {

      return [];
    }
  }

  async getTodayChallenge(): Promise<IDailyChallenge | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('date', today)
        .single();

      if (error) {throw error;}
      return data;
    } catch (error) {

      return null;
    }
  }

  async getUserChallengeProgress(userId: string, challengeId: string): Promise<IUserChallenge | null> {
    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_id', challengeId)
        .single();

      if (error && error.code !== 'PGRST116') {throw error;} // PGRST116 = no rows returned
      return data;
    } catch (error) {

      return null;
    }
  }

  async getUserBadges(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {throw error;}
      return data || [];
    } catch (error) {

      return [];
    }
  }

  async getUserRanking(userId: string): Promise<{ global: any | null; weekly: any | null }> {
    try {
      // Classement global
      const { data: globalRank, error: globalError } = await supabase
        .from('rankings')
        .select('*')
        .eq('user_id', userId)
        .eq('ranking_type', 'global')
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      // Classement hebdomadaire
      const { data: weeklyRank, error: weeklyError } = await supabase
        .from('rankings')
        .select('*')
        .eq('user_id', userId)
        .eq('ranking_type', 'weekly')
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      return {
        global: globalError ? null : globalRank,
        weekly: weeklyError ? null : weeklyRank,
      };
    } catch (error) {

      return { global: null, weekly: null };
    }
  }

  async getLeaderboard(type: 'global' | 'weekly' = 'global', limit = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('rankings')
        .select(`
          *,
          profiles!inner (username, avatar_url, current_grade)
        `)
        .eq('ranking_type', type)
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) {throw error;}
      return data || [];
    } catch (error) {

      return [];
    }
  }
}

export const userService = new UserService();

