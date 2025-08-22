import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '../store/AuthContext';

// Constants
const STALE_TIME_MINUTES = 5;
const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;

interface IUserData {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export function useUser(): ReturnType<typeof useQuery<IUserData | null>> {
  const { user, isGuest } = useAuth();

  return useQuery<IUserData | null>({
    queryKey: ['user', user?.id],
    queryFn: async () => {
      if (!user || isGuest) {
        return null;
      }

      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user && !isGuest,
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * STALE_TIME_MINUTES,
  });
}
