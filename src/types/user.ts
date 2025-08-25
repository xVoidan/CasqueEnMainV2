// Types pour les données utilisateur

export interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

export interface IRanking {
  position: number;
  score: number;
  totalPlayers: number;
}

export interface IRecentSession {
  id: string;
  date: Date;
  score: number;
  questionCount: number;
  duration: number;
  themes: string[];
}

export interface IUserStats {
  totalPoints: number;
  questionsAnswered: number;
  correctAnswers: number;
  averageScore: number;
  currentStreak: number;
  bestStreak: number;
  trainingSessions: number;
  timeSpent: number;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  grade: string;
  progressToNextGrade: number;
}

export interface IUserData extends IUserStats {
  isLoading: boolean;
  error: string | null;
  badges: IBadge[];
  ranking: {
    global: IRanking | null;
    weekly: IRanking | null;
  };
  recentSessions: IRecentSession[];
  dailyChallengeCompleted: boolean;
}

