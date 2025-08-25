import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { CelebrationAnimation } from '../../components/animations/CelebrationAnimation';
import { CircularProgress } from '../../components/charts/CircularProgress';
import { calculateBadges } from '../../components/badges/BadgeDisplay';
import { EnhancedBadgeDisplay } from '../../components/badges/EnhancedBadgeDisplay';
import { ThemePerformanceChart } from '../../components/charts/ThemePerformanceChart';
import { ProgressComparison } from '../../components/stats/ProgressComparison';
import { RankingDisplay } from '../../components/ranking/RankingDisplay';
import { SwipeableSection } from '../../components/navigation/SwipeableSection';
import { PersonalizedFeedback } from '../../components/feedback/PersonalizedFeedback';
import { TimeSeriesChart } from '../../components/charts/TimeSeriesChart';
import { RadarChart } from '../../components/charts/RadarChart';
import { exportToPDF, shareResults as shareResultsExport } from '../../utils/exportUtils';
import { theme } from '../../styles/theme';
import { modalTheme } from '../../styles/modalTheme';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/store/AuthContext';
import { getProgressToNext, formatPoints } from '../../utils/grades';


interface ISessionAnswer {
  questionId: string;
  selectedAnswers: string[];
  timeSpent: number;
  isCorrect: boolean;
  isPartial?: boolean;
  isSkipped: boolean;
}

interface IQuestion {
  id: string;
  theme: string;
  subTheme: string;
  question: string;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
}

interface ISessionConfig {
  scoring: {
    correct: number;
    incorrect: number;
    skipped: number;
    partial: number;
  };
}

interface IStats {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  partialAnswers: number;
  skippedAnswers: number;
  averageTime: number;
  totalScore: number;
  successRate: number;
  totalTime: number;
}

export function TrainingReportScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  console.log('[TrainingReportScreen] Params:', params);

  let sessionAnswers: ISessionAnswer[] = [];
  let questions: IQuestion[] = [];
  let config: ISessionConfig = { scoring: { correct: 1, incorrect: 0, skipped: 0, partial: 0.5 } };
  let questionsToReview: string[] = [];
  let totalPoints: number = 0;

  try {
    sessionAnswers = params.sessionAnswers
      ? JSON.parse(params.sessionAnswers as string)
      : [];
    questions = params.questions
      ? JSON.parse(params.questions as string)
      : [];
    config = params.config
      ? JSON.parse(params.config as string)
      : { scoring: { correct: 1, incorrect: 0, skipped: 0, partial: 0.5 } };
    questionsToReview = params.questionsToReview
      ? JSON.parse(params.questionsToReview as string)
      : [];
    totalPoints = params.totalPoints
      ? parseInt(params.totalPoints as string)
      : 0;
  } catch (error) {
    console.error('[TrainingReportScreen] Erreur parsing params:', error);
  }

  console.log('[TrainingReportScreen] Data parsed:', {
    sessionAnswers: sessionAnswers?.length,
    questions: questions?.length,
    questionsToReview: questionsToReview?.length,
    totalPoints,
  });

  const [stats, setStats] = useState<IStats>({
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    partialAnswers: 0,
    skippedAnswers: 0,
    averageTime: 0,
    totalScore: 0,
    successRate: 0,
    totalTime: 0,
  });
  const [_saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [userTotalPoints, setUserTotalPoints] = useState(0);
  const [gradeProgress, setGradeProgress] = useState<any>(null);
  const [themePerformance, setThemePerformance] = useState<any[]>([]);
  const [progressData, setProgressData] = useState({
    lastSessionScore: 0,
    averageScore: 0,
    bestScore: 0,
    streak: 0,
  });
  const [historicalData, setHistoricalData] = useState<{ date: Date; score: number }[]>([]);
  const [rankingData, setRankingData] = useState<{
    userRank: number;
    totalUsers: number;
    percentile: number;
    weeklyProgress: number;
    monthlyProgress: number;
    topPlayers: { name: string; points: number }[];
  }>({
    userRank: 0,
    totalUsers: 0,
    percentile: 0,
    weeklyProgress: 0,
    monthlyProgress: 0,
    topPlayers: [],
  });

  useEffect(() => {
    // Initialiser les stats de manière synchrone
    calculateStats();
    calculateThemePerformance();

    // Les opérations async peuvent être lancées après
    const initializeAsync = async () => {
      await saveSessionToHistory();
      await fetchUserPoints();
      await fetchProgressData();
      await fetchRankingData();
    };

    initializeAsync();
  }, []);

  useEffect(() => {
    // Utiliser setTimeout pour éviter les mises à jour pendant le rendu
    const timer = setTimeout(() => {
      if (stats.successRate >= 80) {
        setShowCelebration(true);
      }
      const earnedBadges = calculateBadges(stats, []);
      setBadges(earnedBadges);
    }, 0);

    return () => clearTimeout(timer);
  }, [stats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (userTotalPoints > 0) {
        const progress = getProgressToNext(userTotalPoints);
        setGradeProgress(progress);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [userTotalPoints]);

  const calculateThemePerformance = () => {
    if (!questions || questions.length === 0) {
      setThemePerformance([]);
      return;
    }

    const themeStats: { [key: string]: any } = {};

    questions.forEach((question, index) => {
      const answer = sessionAnswers[index];
      if (!themeStats[question.theme]) {
        themeStats[question.theme] = {
          theme: question.theme,
          correct: 0,
          incorrect: 0,
          total: 0,
        };
      }

      themeStats[question.theme].total++;
      if (answer?.isCorrect) {
        themeStats[question.theme].correct++;
      } else {
        themeStats[question.theme].incorrect++;
      }
    });

    const performanceData = Object.values(themeStats).map((stat: any) => ({
      ...stat,
      percentage: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0,
    }));

    setThemePerformance(performanceData);
  };

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      // Récupérer les sessions depuis Supabase pour les 7 derniers jours
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: supabaseSessions } = await supabase
        .from('sessions')
        .select('score, completed_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', sevenDaysAgo)
        .order('completed_at', { ascending: true });

      let historical: { date: Date; score: number }[] = [];
      let scores: number[] = [];

      if (supabaseSessions && supabaseSessions.length > 0) {
        // Utiliser les données Supabase
        historical = supabaseSessions.map(s => ({
          date: new Date(s.completed_at),
          score: s.score || 0,
        }));
        scores = supabaseSessions.map(s => s.score || 0);
      } else {
        // Fallback sur AsyncStorage si pas de données Supabase
        const historyKey = `@training_history_${user.id}`;
        const history = await AsyncStorage.getItem(historyKey);

        if (history) {
          const sessions = JSON.parse(history);
          if (Array.isArray(sessions)) {
            scores = sessions.map((s: any) => s.stats?.totalScore || 0);
            historical = sessions.slice(0, 7).map((s: any) => ({
              date: new Date(s.completedAt || Date.now()),
              score: s.stats?.totalScore || 0,
            }));
          }
        }
      }

      // Ajouter la session actuelle
      historical.push({
        date: new Date(),
        score: stats.successRate,
      });

      setHistoricalData(historical);

      // Calculer la streak actuelle
      let streak = 0;
      for (const answer of sessionAnswers) {
        if (answer?.isCorrect) {
          streak++;
        } else {
          break;
        }
      }

      setProgressData({
        lastSessionScore: scores.length > 0 ? scores[scores.length - 1] : 0,
        averageScore: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0,
        bestScore: scores.length > 0 ? Math.max(...scores, stats.successRate) : stats.successRate,
        streak,
      });
    } catch (error) {
      console.error('Erreur récupération progression:', error);
    }
  };

  const fetchRankingData = async () => {
    if (!user) return;

    try {
      // Récupérer tous les scores des utilisateurs
      const { data: allProfiles, error } = await supabase
        .from('profiles')
        .select('user_id, total_points')
        .order('total_points', { ascending: false });

      if (error) {
        console.error('Erreur récupération classement:', error);
        return;
      }

      if (allProfiles && allProfiles.length > 0) {
        const totalUsers = allProfiles.length;
        const userRank = allProfiles.findIndex(p => p.user_id === user.id) + 1;
        const percentile = userRank > 0 ? Math.floor((1 - userRank / totalUsers) * 100) : 0;

        // Récupérer le top 3 avec les noms d'utilisateur
        const top3Ids = allProfiles ? allProfiles.slice(0, 3).map(p => p.user_id) : [];

        let topPlayers: { name: string; points: number }[] = [];
        if (top3Ids.length > 0) {
          const { data: top3Profiles } = await supabase
            .from('profiles')
            .select('user_id, username, total_points')
            .in('user_id', top3Ids);

          topPlayers = top3Profiles
            ? top3Profiles.map(p => ({
                name: p.username || 'Anonyme',
                points: p.total_points || 0,
              })).sort((a, b) => b.points - a.points)
            : [];
        }

        // Récupérer l'historique pour calculer la progression
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: weeklySession } = await supabase
          .from('sessions')
          .select('score')
          .eq('user_id', user.id)
          .gte('completed_at', oneWeekAgo)
          .order('completed_at', { ascending: false })
          .limit(1);

        const { data: monthlySession } = await supabase
          .from('sessions')
          .select('score')
          .eq('user_id', user.id)
          .gte('completed_at', oneMonthAgo)
          .order('completed_at', { ascending: false })
          .limit(1);

        const currentScore = stats.totalScore;
        const weeklyProgress = weeklySession?.[0] ? currentScore - weeklySession[0].score : 0;
        const monthlyProgress = monthlySession?.[0] ? currentScore - monthlySession[0].score : 0;

        setRankingData({
          userRank: userRank || 0,
          totalUsers,
          percentile,
          weeklyProgress,
          monthlyProgress,
          topPlayers,
        });
      }
    } catch (error) {
      console.error('Erreur récupération classement:', error);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        const newTotalPoints = (profile.total_points || 0) + Math.round(totalPoints || 0);
        setUserTotalPoints(newTotalPoints);
      }
    } catch (error) {
      console.error('Erreur récupération points:', error);
    }
  };

  const calculateStats = () => {
    if (!sessionAnswers || sessionAnswers.length === 0) {
      return;
    }

    const correct = sessionAnswers.filter(a => a && a.isCorrect === true).length;
    const incorrect = sessionAnswers.filter(a => a && !a.isCorrect && !a.isPartial && !a.isSkipped).length;
    const partial = sessionAnswers.filter(a => a && a.isPartial === true).length;
    const skipped = sessionAnswers.filter(a => a && a.isSkipped === true).length;
    const totalTime = sessionAnswers.length > 0 ? sessionAnswers.reduce((sum, a) => sum + (a?.timeSpent || 0), 0) : 0;
    const avgTime = sessionAnswers.length > 0 ? totalTime / sessionAnswers.length : 0;

    const score =
      correct * config.scoring.correct +
      incorrect * config.scoring.incorrect +
      partial * (config.scoring.partial || 0.5) +
      skipped * config.scoring.skipped;

    const successRate = sessionAnswers.length > 0 ? (correct / sessionAnswers.length) * 100 : 0;

    setStats({
      totalQuestions: sessionAnswers.length,
      correctAnswers: correct,
      incorrectAnswers: incorrect,
      partialAnswers: partial,
      skippedAnswers: skipped,
      averageTime: avgTime,
      totalScore: Math.max(0, score),
      successRate,
      totalTime,
    });
  };

  const saveSessionToHistory = async () => {
    if (!user || !sessionAnswers || sessionAnswers.length === 0) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          config: config,
          score: stats.totalScore,
          total_points_earned: Math.round(totalPoints || 0),
          status: 'completed',
          ended_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Erreur sauvegarde session:', error);
      }

      const historyKey = `@training_history_${user.id}`;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      history.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        stats,
        config,
      });

      if (history.length > 50) {
        history.pop();
      }

      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
    } catch (error) {
      console.error('Erreur sauvegarde historique:', error);
    } finally {
      setSaving(false);
    }
  };


  const handleExportPDF = async () => {
    try {
      const sessionData = {
        score: stats.successRate,
        correctAnswers: stats.correctAnswers,
        incorrectAnswers: stats.incorrectAnswers,
        totalQuestions: stats.totalQuestions,
        themePerformance: themePerformance,
        totalTime: stats.totalTime,
        grade: gradeProgress?.currentGrade.name || 'Aspirant',
        totalPoints: userTotalPoints,
        date: new Date(),
      };
      await exportToPDF(sessionData);
    } catch (error) {
      console.error('Erreur export PDF:', error);
    }
  };

  const handleShareResults = async () => {
    try {
      const sessionData = {
        score: stats.successRate,
        correctAnswers: stats.correctAnswers,
        incorrectAnswers: stats.incorrectAnswers,
        totalQuestions: stats.totalQuestions,
        themePerformance: themePerformance,
        totalTime: stats.totalTime,
        grade: gradeProgress?.currentGrade.name || 'Aspirant',
        totalPoints: userTotalPoints,
        date: new Date(),
      };
      await shareResultsExport(sessionData);
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleReviewErrors = () => {
    const questionsForReview = questions.filter((q, index) => {
      const answer = sessionAnswers[index];
      return (answer && !answer.isCorrect) || questionsToReview.includes(q.id);
    });

    const reviewConfig = {
      ...config,
      isReviewMode: true,
      allowNavigation: true,
      showCorrectAnswers: true,
    };

    router.push({
      pathname: '/training/rattrapage',
      params: {
        questions: JSON.stringify(questionsForReview),
        config: JSON.stringify(reviewConfig),
        originalAnswers: JSON.stringify(sessionAnswers),
      },
    });
  };

  const handleNewSession = () => {
    router.replace('/training/free');
  };

  const handleBackToHome = () => {
    router.replace('/(tabs)');
  };

  const getGradeMessage = (rate: number): string => {
    if (rate >= 90) return 'Excellent travail !';
    if (rate >= 75) return 'Très bien !';
    if (rate >= 60) return 'Bon travail !';
    if (rate >= 40) return 'Continuez vos efforts !';
    return 'Il faut plus s\'entraîner !';
  };

  const getScoreColor = (rate: number): string => {
    if (rate >= 75) return '#10B981';
    if (rate >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getGradeImage = (imageName: string) => {
    const images: { [key: string]: any } = {
      '1Aspirant.png': require('@/assets/images/1Aspirant.png'),
      '2Sapeur.png': require('@/assets/images/2Sapeur.png'),
      '3Caporal.png': require('@/assets/images/3Caporal.png'),
      '4CaporalChef.png': require('@/assets/images/4CaporalChef.png'),
      '5Sergent.png': require('@/assets/images/5Sergent.png'),
      '6SergentChef.png': require('@/assets/images/6SergentChef.png'),
      '7Adjudant.png': require('@/assets/images/7Adjudant.png'),
      '8AdjudantChef.png': require('@/assets/images/8AdjudantChef.png'),
      '9Lieutenant.png': require('@/assets/images/9Lieutenant.png'),
      '10Commandant.png': require('@/assets/images/10Commandant.png'),
      '11Capitaine.png': require('@/assets/images/11Capitaine.png'),
      '12LieutenantColonel.png': require('@/assets/images/12LieutenantColonel.png'),
      '13Colonel.png': require('@/assets/images/13Colonel.png'),
      '14ControleurGeneral.png': require('@/assets/images/14ControleurGeneral.png'),
      '15ControleurGeneralEtat.png': require('@/assets/images/15ControleurGeneralEtat.png'),
    };
    return images[imageName];
  };

  try {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
        {showCelebration && (
          <CelebrationAnimation
            visible={showCelebration}
            type="confetti"
            onComplete={() => {
              setTimeout(() => setShowCelebration(false), 0);
            }}
          />
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <FadeInView duration={600} delay={0}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Session terminée</Text>
              <Text style={styles.headerDate}>
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
          </FadeInView>

          {/* Score principal */}
          <FadeInView duration={600} delay={200}>
            <View style={styles.scoreSection}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
                style={styles.scoreCard}
              >
                <View style={styles.scoreTop}>
                  <CircularProgress
                    percentage={stats.successRate}
                    size={100}
                    strokeWidth={8}
                    color={getScoreColor(stats.successRate)}
                    showPercentage={true}
                  />
                  <View style={styles.scoreInfo}>
                    <Text style={styles.scorePoints}>{stats.totalScore.toFixed(0)}</Text>
                    <Text style={styles.scoreLabel}>points gagnés</Text>
                    <Text style={[styles.scoreMessage, { color: getScoreColor(stats.successRate) }]}>
                      {getGradeMessage(stats.successRate)}
                    </Text>
                  </View>
                </View>

                {/* Stats rapides */}
                <View style={styles.quickStats}>
                  <View style={styles.quickStatItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.quickStatValue}>{stats.correctAnswers}</Text>
                    <Text style={styles.quickStatLabel}>Correctes</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStatItem}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                    <Text style={styles.quickStatValue}>{stats.incorrectAnswers}</Text>
                    <Text style={styles.quickStatLabel}>Incorrectes</Text>
                  </View>
                  <View style={styles.quickStatDivider} />
                  <View style={styles.quickStatItem}>
                    <Ionicons name="time" size={20} color="#3B82F6" />
                    <Text style={styles.quickStatValue}>{stats.averageTime.toFixed(0)}s</Text>
                    <Text style={styles.quickStatLabel}>Temps moy.</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </FadeInView>

          {/* Détail du barème */}
          <FadeInView duration={600} delay={300}>
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Détail du calcul</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <View style={styles.detailLeft}>
                    <View style={[styles.detailIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                      <Ionicons name="checkmark" size={14} color="#10B981" />
                    </View>
                    <Text style={styles.detailLabel}>Correctes</Text>
                  </View>
                  <Text style={styles.detailCalc}>
                    {stats.correctAnswers} × {config.scoring.correct} =
                  </Text>
                  <Text style={[styles.detailResult, { color: '#10B981' }]}>
                    +{(stats.correctAnswers * config.scoring.correct).toFixed(0)}
                  </Text>
                </View>

                {stats.incorrectAnswers > 0 && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                        <Ionicons name="close" size={14} color="#EF4444" />
                      </View>
                      <Text style={styles.detailLabel}>Incorrectes</Text>
                    </View>
                    <Text style={styles.detailCalc}>
                      {stats.incorrectAnswers} × {config.scoring.incorrect} =
                    </Text>
                    <Text style={[styles.detailResult, { color: '#EF4444' }]}>
                      {(stats.incorrectAnswers * config.scoring.incorrect).toFixed(0)}
                    </Text>
                  </View>
                )}

                {stats.skippedAnswers > 0 && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <View style={[styles.detailIcon, { backgroundColor: 'rgba(156, 163, 175, 0.2)' }]}>
                        <Ionicons name="remove" size={14} color="#9CA3AF" />
                      </View>
                      <Text style={styles.detailLabel}>Passées</Text>
                    </View>
                    <Text style={styles.detailCalc}>
                      {stats.skippedAnswers} × {config.scoring.skipped} =
                    </Text>
                    <Text style={[styles.detailResult, { color: '#9CA3AF' }]}>
                      {(stats.skippedAnswers * config.scoring.skipped).toFixed(0)}
                    </Text>
                  </View>
                )}

                <View style={styles.detailSeparator} />

                <View style={styles.detailTotal}>
                  <Text style={styles.detailTotalLabel}>SCORE TOTAL</Text>
                  <Text style={styles.detailTotalValue}>{stats.totalScore.toFixed(0)} pts</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Graphique de performance par thème */}
          {themePerformance && themePerformance.length > 0 && (
            <FadeInView duration={600} delay={350}>
              <ThemePerformanceChart data={themePerformance || []} />
            </FadeInView>
          )}

          {/* Comparaison et progression */}
          <FadeInView duration={600} delay={400}>
            <ProgressComparison
              currentScore={stats.totalScore}
              lastSessionScore={progressData.lastSessionScore}
              averageScore={progressData.averageScore}
              bestScore={progressData.bestScore}
              streak={progressData.streak}
              totalTime={stats.totalTime}
            />
          </FadeInView>

          {/* Classement */}
          {rankingData.userRank > 0 && (
            <FadeInView duration={600} delay={450}>
              <RankingDisplay
                userRank={rankingData.userRank}
                totalUsers={rankingData.totalUsers}
                percentile={rankingData.percentile}
                weeklyProgress={rankingData.weeklyProgress}
                monthlyProgress={rankingData.monthlyProgress}
                topPlayers={rankingData.topPlayers || []}
              />
            </FadeInView>
          )}

          {/* Progression des grades */}
          {gradeProgress && (
            <FadeInView duration={600} delay={400}>
              <View style={styles.gradeSection}>
                <Text style={styles.sectionTitle}>Progression</Text>
                <View style={styles.gradeCard}>
                  {/* Points gagnés */}
                  <View style={styles.pointsEarned}>
                    <Text style={styles.pointsEarnedLabel}>Points gagnés</Text>
                    <View style={styles.pointsEarnedBadge}>
                      <Text style={styles.pointsEarnedValue}>+{Math.round(totalPoints || 0)}</Text>
                    </View>
                  </View>

                  {/* Grade actuel */}
                  <View style={styles.currentGrade}>
                    <Image
                      source={getGradeImage(gradeProgress.currentGrade.imageName)}
                      style={styles.gradeImage}
                      resizeMode="contain"
                    />
                    <View style={styles.gradeInfo}>
                      <Text style={styles.gradeName}>{gradeProgress.currentGrade.name}</Text>
                      <Text style={styles.gradePointsTotal}>{formatPoints(userTotalPoints)} points</Text>
                    </View>
                  </View>

                  {/* Barre de progression */}
                  {gradeProgress.nextGrade && (
                    <>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${gradeProgress.progress}%`,
                                backgroundColor: gradeProgress.currentGrade.color,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>{gradeProgress.progress.toFixed(0)}%</Text>
                      </View>

                      {/* Prochain grade */}
                      <View style={styles.nextGrade}>
                        <Image
                          source={getGradeImage(gradeProgress.nextGrade.imageName)}
                          style={styles.nextGradeImage}
                          resizeMode="contain"
                        />
                        <View style={styles.nextGradeInfo}>
                          <Text style={styles.nextGradeLabel}>Prochain grade</Text>
                          <Text style={styles.nextGradeName}>{gradeProgress.nextGrade.name}</Text>
                          <Text style={styles.nextGradePoints}>
                            {formatPoints(gradeProgress.pointsNeeded)} points restants
                          </Text>
                        </View>
                      </View>
                    </>
                  )}

                  {/* Grade maximum */}
                  {!gradeProgress.nextGrade && (
                    <View style={styles.maxGrade}>
                      <Ionicons name="trophy" size={32} color="#FFD700" />
                      <Text style={styles.maxGradeText}>Grade maximum atteint !</Text>
                    </View>
                  )}
                </View>
              </View>
            </FadeInView>
          )}

          {/* Section avec navigation swipeable */}
          <FadeInView duration={600} delay={500}>
            <Text style={styles.sectionTitle}>Analyses Détaillées</Text>
            <SwipeableSection>
              {/* Feedback personnalisé */}
              <PersonalizedFeedback
                data={{
                  score: stats.successRate,
                  correctAnswers: stats.correctAnswers,
                  incorrectAnswers: stats.incorrectAnswers,
                  streak: progressData.streak,
                  timePerQuestion: stats.averageTime,
                  weakThemes: themePerformance && themePerformance.length > 0
                    ? themePerformance.filter(t => t.percentage < 60).map(t => t.theme)
                    : [],
                  strongThemes: themePerformance && themePerformance.length > 0
                    ? themePerformance.filter(t => t.percentage >= 80).map(t => t.theme)
                    : [],
                  improvement: progressData.lastSessionScore > 0
                    ? stats.totalScore - progressData.lastSessionScore
                    : 0,
                }}
              />

              {/* Graphique temporel */}
              {historicalData && historicalData.length > 0 && (
                <TimeSeriesChart
                  data={historicalData || []}
                  title="Progression sur 7 jours"
                />
              )}

              {/* Graphique radar */}
              {themePerformance && themePerformance.length > 0 && (
                <RadarChart
                  data={(themePerformance || []).slice(0, 6).map(t => ({
                    label: t.theme.length > 10 ? `${t.theme.substring(0, 10)  }...` : t.theme,
                    value: t.correct,
                    maxValue: t.total,
                  }))}
                  title="Analyse par compétence"
                />
              )}
            </SwipeableSection>
          </FadeInView>

          {/* Badges améliorés */}
          <FadeInView duration={600} delay={550}>
            <EnhancedBadgeDisplay
              badges={(badges || []).map(b => {
                // Calculer le vrai progrès basé sur les statistiques
                let progress = 0;
                let requirement = '';

                if (!b.earned) {
                  if (b.id === 'first-perfect') {
                    progress = stats.successRate;
                    requirement = `Score de 100% requis (actuel: ${stats.successRate.toFixed(0)}%)`;
                  } else if (b.id === 'speed-demon') {
                    progress = stats.averageTime < 5 ? 100 : (5 / stats.averageTime) * 100;
                    requirement = `Temps moyen < 5s (actuel: ${stats.averageTime.toFixed(1)}s)`;
                  } else if (b.id === 'streak-master') {
                    progress = (progressData.streak / 10) * 100;
                    requirement = `10 bonnes réponses d'affilée (actuel: ${progressData.streak})`;
                  } else if (b.id === 'quiz-veteran') {
                    progress = (stats.totalQuestions / 100) * 100;
                    requirement = `100 questions répondues (actuel: ${stats.totalQuestions})`;
                  }
                }

                return {
                  ...b,
                  progress: !b.earned ? Math.min(100, Math.max(0, progress)) : undefined,
                  requirement: !b.earned ? requirement : undefined,
                };
              })}
              newBadges={(badges || []).filter(b => {
                // Les nouveaux badges sont ceux gagnés dans cette session
                return b.earned && b.earnedAt &&
                  new Date(b.earnedAt).getTime() > Date.now() - 60000; // Gagnés dans la dernière minute
              }).map(b => b.id)}
              onBadgePress={() => {}}
            />
          </FadeInView>

          {/* Actions */}
          <FadeInView duration={600} delay={600}>
            <View style={styles.actions}>
              {(stats.incorrectAnswers > 0 || questionsToReview.length > 0) && (
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={handleReviewErrors}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={modalTheme.gradients.secondary}
                    style={styles.buttonGradient}
                  >
                    <Ionicons name="school" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>
                      Revoir les erreurs ({stats.incorrectAnswers + questionsToReview.length})
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setShowDetails(!showDetails)}
                >
                  <Ionicons name={showDetails ? 'eye-off' : 'eye'} size={18} color={theme.colors.white} />
                  <Text style={styles.secondaryButtonText}>Détails</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleShareResults}
                >
                  <Ionicons name="share-social" size={18} color={theme.colors.white} />
                  <Text style={styles.secondaryButtonText}>Partager</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleExportPDF}
                >
                  <Ionicons name="document-text" size={18} color={theme.colors.white} />
                  <Text style={styles.secondaryButtonText}>PDF</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.newSessionButton}
                onPress={handleNewSession}
              >
                <LinearGradient
                  colors={modalTheme.gradients.primary}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="refresh" size={22} color="#FFFFFF" />
                  <Text style={styles.buttonText}>Nouvelle session</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={handleBackToHome}
              >
                <Text style={styles.homeButtonText}>Retour à l'accueil</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>

          {/* Détails des questions */}
          {showDetails && questions && questions.length > 0 && sessionAnswers && sessionAnswers.length > 0 && (
            <FadeInView duration={400}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Détail des réponses</Text>
                {(questions || []).map((question, index) => {
                  const answer = sessionAnswers[index];
                  if (!answer) return null;

                  return (
                    <View key={question.id} style={styles.questionItem}>
                      <View style={styles.questionHeader}>
                        <Ionicons
                          name={answer.isCorrect ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={answer.isCorrect ? '#10B981' : '#EF4444'}
                        />
                        <Text style={styles.questionNumber}>Question {index + 1}</Text>
                        <Text style={styles.questionTime}>{answer.timeSpent ? answer.timeSpent.toFixed(0) : '0'}s</Text>
                      </View>
                      <Text style={styles.questionText} numberOfLines={2}>
                        {question.question}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </FadeInView>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
    );
  } catch (error: any) {
    console.error('[TrainingReportScreen] Erreur de rendu:', error);
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>
            Une erreur s'est produite lors de l'affichage des résultats
          </Text>
          <Text style={{ color: 'white', fontSize: 14, opacity: 0.8 }}>
            {error?.message || 'Erreur inconnue'}
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={{ marginTop: 20, padding: 10, backgroundColor: '#3B82F6', borderRadius: 8 }}
          >
            <Text style={{ color: 'white' }}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  scoreSection: {
    marginBottom: 20,
  },
  scoreCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreInfo: {
    flex: 1,
    marginLeft: 20,
  },
  scorePoints: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  scoreMessage: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: 4,
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailCalc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginRight: 8,
  },
  detailResult: {
    fontSize: 14,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'right',
  },
  detailSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  detailTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  detailTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: modalTheme.colors.primary,
  },
  gradeSection: {
    marginBottom: 20,
  },
  gradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pointsEarned: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsEarnedLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pointsEarnedBadge: {
    backgroundColor: modalTheme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsEarnedValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentGrade: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  gradeImage: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  gradePointsTotal: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: 4,
  },
  nextGrade: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 12,
    borderRadius: 8,
  },
  nextGradeImage: {
    width: 40,
    height: 40,
    marginRight: 12,
    opacity: 0.6,
  },
  nextGradeInfo: {
    flex: 1,
  },
  nextGradeLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
  },
  nextGradeName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
  },
  nextGradePoints: {
    fontSize: 12,
    color: modalTheme.colors.warning,
  },
  maxGrade: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  maxGradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 8,
  },
  actions: {
    marginTop: 20,
  },
  reviewButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    marginLeft: 6,
  },
  newSessionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  homeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  homeButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailsSection: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 12,
  },
  questionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  questionNumber: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  questionTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  questionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
  },
});
