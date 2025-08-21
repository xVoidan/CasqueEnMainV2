// Types pour l'authentification
export interface IUser {
  id: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  grade: IGrade;
  totalPoints: number;
  currentStreak: number;
  createdAt: Date;
  updatedAt: Date;
  isGuest?: boolean;
}

// Types pour les grades (15 grades pompier)
export interface IGrade {
  id: number;
  name: string;
  imageUrl: string;
  minPoints: number;
  maxPoints: number;
}

// Types pour les quiz
export interface IQuizSession {
  id: string;
  userId: string;
  themes: ITheme[];
  questionCount: number | 'unlimited';
  hasTimer: boolean;
  timerDuration?: number; // en secondes
  scoring: IScoring;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  totalPoints?: number;
}

export interface ITheme {
  id: string;
  name: 'mathematics' | 'french' | 'profession';
  label: string;
  subThemes: ISubTheme[];
}

export interface ISubTheme {
  id: string;
  themeId: string;
  name: string;
  label: string;
  isSelected: boolean;
}

export interface IQuestion {
  id: string;
  themeId: string;
  subThemeId: string;
  text: string;
  options: IOption[];
  correctAnswerId: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface IOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface IAnswer {
  questionId: string;
  selectedOptionId: string | null; // null si pas de réponse
  isCorrect: boolean;
  timeSpent: number; // en secondes
  points: number;
}

// Système de scoring
export interface IScoring {
  correctAnswer: number;
  wrongAnswer: number;
  noAnswer: number;
  partialAnswer?: number;
}

// Défis quotidiens
export interface IDailyChallenge {
  id: string;
  date: Date;
  theme: ITheme;
  questions: IQuestion[];
  completedBy: string[]; // IDs des utilisateurs
}

// Classements
export interface IRanking {
  userId: string;
  username: string;
  avatarUrl?: string;
  grade: IGrade;
  points: number;
  rank: number;
}

export type RankingPeriod = 'global' | 'weekly' | 'monthly';
export type RankingCategory = 'overall' | 'mathematics' | 'french' | 'profession';

// Statistiques
export interface IStatistics {
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  favoriteTheme: string;
  progressByTheme: IThemeProgress[];
  dailyStats: IDailyStat[];
}

export interface IThemeProgress {
  themeId: string;
  themeName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
}

export interface IDailyStat {
  date: Date;
  questionsAnswered: number;
  correctAnswers: number;
  pointsEarned: number;
}

// Configuration par défaut du quiz
export const DEFAULT_QUIZ_CONFIG: Partial<IQuizSession> = {
  questionCount: 'unlimited',
  hasTimer: false,
  scoring: {
    correctAnswer: 1,
    wrongAnswer: -0.5,
    noAnswer: -0.5,
  },
};
