import { QueryClient } from '@tanstack/react-query';

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MAX_RETRY_DELAY = 30000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Durée de cache par défaut : 1 minute
      staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE,
      // Durée de conservation en cache : 5 minutes
      gcTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 5,
      // Réessayer 2 fois en cas d'échec
      retry: 2,
      // Délai entre les tentatives
      retryDelay: (attemptIndex) =>
        Math.min(MILLISECONDS_IN_SECOND * 2 ** attemptIndex, MAX_RETRY_DELAY),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Réessayer 1 fois pour les mutations
      retry: 1,
    },
  },
});

// Configuration spécifique pour certaines queries
export const QUERY_KEYS = {
  // User & Profile
  userProfile: ['user', 'profile'],
  userStats: ['user', 'stats'],
  userBadges: ['user', 'badges'],

  // Rankings - Cache 1 minute
  rankings: ['rankings'],
  rankingsGlobal: ['rankings', 'global'],
  rankingsWeekly: ['rankings', 'weekly'],
  rankingsMonthly: ['rankings', 'monthly'],

  // Stats - Cache 5 minutes
  progressData: ['stats', 'progress'],
  sessionHistory: ['stats', 'sessions'],

  // Questions & Quiz
  questions: ['questions'],
  themes: ['themes'],
  dailyChallenge: ['daily-challenge'],

  // Revision
  revisionQuestions: ['revision', 'questions'],
  masteredQuestions: ['revision', 'mastered'],
};

// Options de cache personnalisées
export const CACHE_OPTIONS = {
  // Pour les stats : 5 minutes
  stats: {
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 5,
    gcTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 10,
  },

  // Pour les rankings : 1 minute
  rankings: {
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE,
    gcTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 5,
  },

  // Pour les données statiques (thèmes, badges) : 30 minutes
  static: {
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 30,
    gcTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 60,
  },

  // Pour le profil utilisateur : 2 minutes
  profile: {
    staleTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 2,
    gcTime: MILLISECONDS_IN_SECOND * SECONDS_IN_MINUTE * 10,
  },
};

// Fonctions utilitaires pour invalider le cache
export const invalidateQueries = {
  userProfile: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile }),
  rankings: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rankings }),
  stats: () => queryClient.invalidateQueries({ queryKey: ['stats'] }),
  all: () => queryClient.invalidateQueries(),
};
