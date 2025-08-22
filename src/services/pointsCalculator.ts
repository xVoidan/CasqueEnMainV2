import { ISessionAnswer, ISessionConfig } from './sessionService';

export interface IPointsBreakdown {
  basePoints: number;
  performanceBonus: number;
  speedBonus: number;
  streakBonus: number;
  totalPoints: number;
}

export interface ISessionStats {
  correct: number;
  partial: number;
  incorrect: number;
  skipped: number;
  total: number;
  percentage: number;
  averageTime: number;
}

class PointsCalculator {
  /**
   * Calculer les statistiques d'une session
   */
  calculateStats(answers: ISessionAnswer[]): ISessionStats {
    const correct = answers.filter(a => a.isCorrect).length;
    const partial = answers.filter(a => a.isPartial).length;
    const incorrect = answers.filter(a => !a.isCorrect && !a.isPartial && !a.isSkipped).length;
    const skipped = answers.filter(a => a.isSkipped).length;
    const total = answers.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    const averageTime = total > 0 
      ? answers.reduce((acc, a) => acc + a.timeSpent, 0) / total 
      : 0;

    return {
      correct,
      partial,
      incorrect,
      skipped,
      total,
      percentage,
      averageTime,
    };
  }

  /**
   * Calculer les points d'une session
   */
  calculatePoints(
    answers: ISessionAnswer[],
    config: ISessionConfig,
    streakDays: number = 0,
  ): IPointsBreakdown {
    const stats = this.calculateStats(answers);
    const scoring = config.scoring;

    // Points de base selon le barème
    const basePoints = this.calculateBasePoints(stats, scoring);

    // Bonus de performance
    const performanceBonus = this.calculatePerformanceBonus(basePoints, stats.percentage);

    // Bonus de vitesse
    const speedBonus = this.calculateSpeedBonus(stats.averageTime, stats.total);

    // Bonus de streak
    const streakBonus = this.calculateStreakBonus(streakDays);

    // Total (minimum 0)
    const totalPoints = Math.max(0, Math.round(
      basePoints + performanceBonus + speedBonus + streakBonus
    ));

    return {
      basePoints: Math.round(basePoints * 10) / 10,
      performanceBonus: Math.round(performanceBonus * 10) / 10,
      speedBonus,
      streakBonus,
      totalPoints,
    };
  }

  /**
   * Calculer les points de base
   */
  private calculateBasePoints(
    stats: ISessionStats,
    scoring: ISessionConfig['scoring'],
  ): number {
    return (
      (stats.correct * scoring.correct) +
      (stats.partial * scoring.partial) +
      (stats.incorrect * scoring.incorrect) +
      (stats.skipped * scoring.skipped)
    );
  }

  /**
   * Calculer le bonus de performance
   */
  private calculatePerformanceBonus(basePoints: number, percentage: number): number {
    if (percentage >= 80) {
      return basePoints * 0.5; // +50%
    } else if (percentage >= 60) {
      return basePoints * 0.2; // +20%
    }
    return 0;
  }

  /**
   * Calculer le bonus de vitesse
   */
  private calculateSpeedBonus(averageTime: number, totalQuestions: number): number {
    // Bonus si moyenne < 5 secondes par question
    if (averageTime < 5) {
      // Bonus progressif : plus c'est rapide, plus le bonus est élevé
      const speedFactor = Math.max(0, 5 - averageTime) / 5; // Entre 0 et 1
      const maxBonus = Math.min(totalQuestions * 2, 20); // Max 20 points
      return Math.round(maxBonus * speedFactor);
    }
    return 0;
  }

  /**
   * Calculer le bonus de streak
   */
  private calculateStreakBonus(streakDays: number): number {
    if (streakDays >= 30) {
      return 30; // Streak légendaire
    } else if (streakDays >= 14) {
      return 20; // Streak épique
    } else if (streakDays >= 7) {
      return 15; // Streak hebdomadaire
    } else if (streakDays >= 3) {
      return 5; // Petit streak
    }
    return 0;
  }

  /**
   * Calculer le multiplicateur de points pour un événement spécial
   */
  calculateEventMultiplier(eventType?: string): number {
    switch (eventType) {
      case 'double_points_weekend':
        return 2;
      case 'happy_hour':
        return 1.5;
      case 'special_challenge':
        return 3;
      default:
        return 1;
    }
  }

  /**
   * Calculer les points pour une question individuelle
   */
  calculateQuestionPoints(
    answer: ISessionAnswer,
    scoring: ISessionConfig['scoring'],
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  ): number {
    let points = 0;

    if (answer.isCorrect) {
      points = scoring.correct;
    } else if (answer.isPartial) {
      points = scoring.partial;
    } else if (answer.isSkipped) {
      points = scoring.skipped;
    } else {
      points = scoring.incorrect;
    }

    // Multiplicateur selon la difficulté
    const difficultyMultiplier = {
      easy: 0.8,
      medium: 1,
      hard: 1.5,
    };

    return points * difficultyMultiplier[difficulty];
  }

  /**
   * Estimer le grade basé sur les points totaux
   */
  estimateGrade(totalPoints: number): {
    name: string;
    icon: string;
    color: string;
    nextGradePoints?: number;
    progress: number;
  } {
    const grades = [
      { name: 'Aspirant', minPoints: 0, color: '#9CA3AF', icon: '🎓' },
      { name: 'Sapeur 2ème classe', minPoints: 100, color: '#6B7280', icon: '⭐' },
      { name: 'Sapeur 1ère classe', minPoints: 250, color: '#4B5563', icon: '⭐⭐' },
      { name: 'Caporal', minPoints: 500, color: '#EF4444', icon: '🔸' },
      { name: 'Caporal-chef', minPoints: 1000, color: '#DC2626', icon: '🔸🔸' },
      { name: 'Sergent', minPoints: 2000, color: '#B91C1C', icon: '🔹' },
      { name: 'Sergent-chef', minPoints: 3500, color: '#991B1B', icon: '🔹🔹' },
      { name: 'Adjudant', minPoints: 5000, color: '#7C2D12', icon: '🔶' },
      { name: 'Adjudant-chef', minPoints: 7500, color: '#F59E0B', icon: '🔶🔶' },
      { name: 'Lieutenant', minPoints: 10000, color: '#D97706', icon: '🏅' },
      { name: 'Lieutenant 1ère classe', minPoints: 15000, color: '#B45309', icon: '🏅🏅' },
      { name: 'Capitaine', minPoints: 20000, color: '#92400E', icon: '🎖️' },
      { name: 'Commandant', minPoints: 30000, color: '#78350F', icon: '🎖️🎖️' },
      { name: 'Lieutenant-colonel', minPoints: 45000, color: '#451A03', icon: '🌟' },
      { name: 'Colonel', minPoints: 60000, color: '#1C1917', icon: '🌟🌟' },
    ];

    for (let i = grades.length - 1; i >= 0; i--) {
      if (totalPoints >= grades[i].minPoints) {
        const currentGrade = grades[i];
        const nextGrade = i < grades.length - 1 ? grades[i + 1] : null;
        
        const progress = nextGrade
          ? ((totalPoints - currentGrade.minPoints) / 
             (nextGrade.minPoints - currentGrade.minPoints)) * 100
          : 100;

        return {
          name: currentGrade.name,
          icon: currentGrade.icon,
          color: currentGrade.color,
          nextGradePoints: nextGrade?.minPoints,
          progress: Math.min(100, Math.max(0, progress)),
        };
      }
    }

    return {
      name: 'Aspirant',
      icon: '🎓',
      color: '#9CA3AF',
      nextGradePoints: 100,
      progress: totalPoints,
    };
  }

  /**
   * Calculer les récompenses bonus
   */
  calculateAchievementBonus(achievements: string[]): number {
    const bonusMap: Record<string, number> = {
      'first_perfect_score': 50,
      'week_streak': 25,
      'month_streak': 100,
      'speed_demon': 30, // Toutes les réponses en < 3s
      'marathon_runner': 40, // 100 questions d'affilée
      'theme_master': 60, // 100% dans un thème
      'all_themes_unlocked': 75,
      'daily_champion': 35, // Meilleur score du jour
    };

    return achievements.reduce((total, achievement) => {
      return total + (bonusMap[achievement] || 0);
    }, 0);
  }
}

export const pointsCalculator = new PointsCalculator();