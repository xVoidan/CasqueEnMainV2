import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/store/AuthContext';
import { userService, IUserProfile, IUserStats } from '@/src/services/userService';

// Grades pompier avec les bons niveaux correspondant aux images
export const GRADES = [
  { id: 1, name: 'Aspirant', minPoints: 0, color: '#9CA3AF', icon: '🎓' },
  { id: 2, name: 'Sapeur', minPoints: 100, color: '#6B7280', icon: '⭐' },
  { id: 3, name: 'Caporal', minPoints: 250, color: '#EF4444', icon: '🔸' },
  { id: 4, name: 'Caporal-Chef', minPoints: 500, color: '#DC2626', icon: '🔸🔸' },
  { id: 5, name: 'Sergent', minPoints: 1000, color: '#B91C1C', icon: '🔹' },
  { id: 6, name: 'Sergent-Chef', minPoints: 2000, color: '#991B1B', icon: '🔹🔹' },
  { id: 7, name: 'Adjudant', minPoints: 3500, color: '#7C2D12', icon: '🔶' },
  { id: 8, name: 'Adjudant-Chef', minPoints: 5000, color: '#F59E0B', icon: '🔶🔶' },
  { id: 9, name: 'Lieutenant', minPoints: 7500, color: '#D97706', icon: '⚜️' },
  { id: 10, name: 'Capitaine', minPoints: 10000, color: '#B45309', icon: '🏅' },
  { id: 11, name: 'Commandant', minPoints: 15000, color: '#92400E', icon: '🏅🏅' },
  { id: 12, name: 'Lieutenant-Colonel', minPoints: 20000, color: '#78350F', icon: '🎖️' },
  { id: 13, name: 'Colonel', minPoints: 30000, color: '#451A03', icon: '🎖️🎖️' },
  { id: 14, name: 'Contrôleur Général', minPoints: 40000, color: '#1C1917', icon: '🌟' },
  { id: 15, name: "Contrôleur Général d'État", minPoints: 50000, color: '#000000', icon: '🌟🌟' },
];

interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

interface IRanking {
  position: number;
  score: number;
  totalPlayers: number;
}

interface IRecentSession {
  id: string;
  date: Date;
  score: number;
  questionCount: number;
  duration: number;
  themes: string[];
}

interface IUserData {
  profile: IUserProfile | null;
  stats: IUserStats[];
  currentGrade: typeof GRADES[0];
  nextGrade: typeof GRADES[0] | null;
  progressToNextGrade: number;
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

export function useUserData(): IUserData & { refreshData: () => Promise<void> } {
  const { user, isGuest } = useAuth();
  const [userData, setUserData] = useState<IUserData>({
    profile: null,
    stats: [],
    currentGrade: GRADES[0],
    nextGrade: GRADES[1],
    progressToNextGrade: 0,
    isLoading: true,
    error: null,
    badges: [],
    ranking: { global: null, weekly: null },
    recentSessions: [],
    dailyChallengeCompleted: false,
  });

  const getGradeInfo = (gradeLevel: number, totalPoints: number) => {
    const currentGrade = GRADES[gradeLevel - 1] || GRADES[0];
    const nextGrade = GRADES[gradeLevel] || null;

    let progress = 0;
    if (nextGrade) {
      const pointsInCurrentGrade = totalPoints - currentGrade.minPoints;
      const pointsNeededForNext = nextGrade.minPoints - currentGrade.minPoints;
      progress = Math.min(100, (pointsInCurrentGrade / pointsNeededForNext) * 100);
    } else {
      progress = 100; // Max grade reached
    }

    return { currentGrade, nextGrade, progress };
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id || isGuest) {
        setUserData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        setUserData(prev => ({ ...prev, isLoading: true, error: null }));

        // Charger toutes les données en parallèle
        const [
          profile,
          stats,
          badges,
          ranking,
          sessions,
          todayChallenge,
        ] = await Promise.all([
          userService.getUserProfile(user.id),
          userService.getUserStats(user.id),
          userService.getUserBadges(user.id),
          userService.getUserRanking(user.id),
          userService.getUserSessions(user.id, 5),
          userService.getTodayChallenge(),
        ]);

        // Vérifier si l'avatar est stocké localement
        if (profile) {
          const localAvatar = await AsyncStorage.getItem(`avatar_${user.id}`);
          if (localAvatar) {
            profile.avatar_url = localAvatar;
          }
        }

        // Vérifier si le défi du jour est complété
        let dailyChallengeCompleted = false;
        if (todayChallenge) {
          const challengeProgress = await userService.getUserChallengeProgress(
            user.id,
            todayChallenge.id,
          );
          dailyChallengeCompleted = !!challengeProgress?.completed_at;
        }

        // Calculer les infos de grade
        const gradeInfo = profile
          ? getGradeInfo(profile.current_grade, profile.total_points)
          : { currentGrade: GRADES[0], nextGrade: GRADES[1], progress: 0 };

        setUserData({
          profile,
          stats,
          currentGrade: gradeInfo.currentGrade,
          nextGrade: gradeInfo.nextGrade,
          progressToNextGrade: gradeInfo.progress,
          badges,
          ranking,
          recentSessions: sessions,
          dailyChallengeCompleted,
          isLoading: false,
          error: null,
        });
      } catch (_error) {

        setUserData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Erreur lors du chargement des données',
        }));
      }
    };

    loadUserData();
  }, [user, isGuest]);

  const refreshData = async (): Promise<void> => {
    if (!user?.id || isGuest) {return;}

    try {
      const profile = await userService.getUserProfile(user.id);
      if (profile) {
        // Vérifier si l'avatar est stocké localement
        const localAvatar = await AsyncStorage.getItem(`avatar_${user.id}`);
        if (localAvatar) {
          profile.avatar_url = localAvatar;
        }

        const gradeInfo = getGradeInfo(profile.current_grade, profile.total_points);
        setUserData(prev => ({
          ...prev,
          profile,
          currentGrade: gradeInfo.currentGrade,
          nextGrade: gradeInfo.nextGrade,
          progressToNextGrade: gradeInfo.progress,
        }));
      }
    } catch (_error) {

    }
  };

  return {
    ...userData,
    refreshData,
  };
}

