import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '../store/AuthContext';

// Constants
const STALE_TIME_MINUTES = 5;
const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;

interface IProfile {
  user_id: string;
  username: string;
  department?: string;
  avatar_url?: string;
  total_points: number;
  current_grade: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

interface IProfileUpdate {
  username?: string;
  department?: string;
  avatar_url?: string;
}

interface IUseProfileReturn {
  profile: IProfile | null | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  updateProfile: (updates: IProfileUpdate) => void;
  isUpdating: boolean;
  stats: unknown[] | null | undefined;
  badges: unknown[] | null | undefined;
}

const useProfileQuery = (
  user: User | null,
  isGuest: boolean,
): ReturnType<typeof useQuery<IProfile | null>> => {
  return useQuery<IProfile | null>({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (user === null || isGuest) {
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: user !== null && !isGuest,
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * STALE_TIME_MINUTES,
  });
};

const useUpdateProfileMutation = (
  user: User | null,
  isGuest: boolean,
  queryClient: ReturnType<typeof useQueryClient>,
): ReturnType<typeof useMutation<IProfile, Error, IProfileUpdate>> => {
  return useMutation({
    mutationFn: async (updates: IProfileUpdate) => {
      if (user === null || isGuest) {
        throw new Error('Utilisateur non connecté');
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
};

const useStatsQuery = (
  user: User | null,
  isGuest: boolean,
): ReturnType<typeof useQuery<unknown[] | null>> => {
  return useQuery({
    queryKey: ['userStats', user?.id],
    queryFn: async () => {
      if (user === null || isGuest) {
        return null;
      }

      const { data, error } = await supabase.from('user_stats').select('*').eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ?? [];
    },
    enabled: user !== null && !isGuest,
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * STALE_TIME_MINUTES,
  });
};

const useBadgesQuery = (
  user: User | null,
  isGuest: boolean,
): ReturnType<typeof useQuery<unknown[] | null>> => {
  return useQuery({
    queryKey: ['userBadges', user?.id],
    queryFn: async () => {
      if (user === null || isGuest) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_badges')
        .select(
          `
          *,
          badges (*)
        `,
        )
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ?? [];
    },
    enabled: user !== null && !isGuest,
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * STALE_TIME_MINUTES,
  });
};

export function useProfile(): IUseProfileReturn {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useProfileQuery(user, isGuest);
  const updateProfileMutation = useUpdateProfileMutation(user, isGuest, queryClient);
  const statsQuery = useStatsQuery(user, isGuest);
  const badgesQuery = useBadgesQuery(user, isGuest);

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isError: profileQuery.isError,
    error: profileQuery.error,
    refetch: () => {
      void profileQuery.refetch();
    },
    updateProfile: (updates: IProfileUpdate) => {
      updateProfileMutation.mutate(updates);
    },
    isUpdating: updateProfileMutation.isPending,
    stats: statsQuery.data,
    badges: badgesQuery.data,
  };
}
