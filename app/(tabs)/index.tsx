import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/AuthContext';
import { useUserData } from '@/src/hooks/useUserData';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';
import { supabase } from '@/src/lib/supabase';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  defaultAvatar: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  userInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  username: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  gradeBadge: {
    alignSelf: 'flex-start',
  },
  gradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  gradeName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.white,
  },
  notificationButton: {
    padding: theme.spacing.sm,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  pointsText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  nextGradeText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarContainer: {
    position: 'relative',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    position: 'absolute',
    right: 0,
    top: -20,
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
  },
  mainCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  mainCardGradient: {
    padding: theme.spacing.xl,
  },
  mainCardContent: {
    alignItems: 'center',
  },
  mainCardIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  mainCardTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  mainCardSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.lg,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  startButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginRight: theme.spacing.sm,
  },
  challengeCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  challengeCompleted: {
    opacity: 0.8,
  },
  challengeGradient: {
    padding: theme.spacing.md,
  },
  challengeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  challengeIcon: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  challengeTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 2,
  },
  challengeSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  challengeReward: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  rewardText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  rewardLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
  },
  revisionCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  revisionGradient: {
    padding: theme.spacing.md,
  },
  newsSection: {
    marginBottom: theme.spacing.lg,
  },
  newsSectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  newsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  newsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  newsDate: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
  },
});

interface DailyChallenge {
  id: string;
  theme: string;
  questions_count: number;
  reward_points: number;
}

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const {
    profile,
    currentGrade,
    nextGrade,
    progressToNextGrade,
    dailyChallengeCompleted,
    isLoading,
    error,
    stats,
    refreshData,
  } = useUserData();

  const [refreshing, setRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [hasNewBadges, setHasNewBadges] = useState(false);
  const [questionsWithErrors, setQuestionsWithErrors] = useState(0);

  // Charger les données supplémentaires
  useEffect(() => {
    loadDailyChallenge();
    checkForNewBadges();
    loadErrorQuestions();
  }, [user]);

  const loadDailyChallenge = async () => {
    try {
      const { data } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (data) {
        setDailyChallenge({
          id: data.id,
          theme: data.theme,
          questions_count: data.questions_ids?.length || 20,
          reward_points: data.reward_points || 50,
        });
      }
    } catch (err) {
      console.error('Erreur chargement défi:', err);
    }
  };

  const checkForNewBadges = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_badges')
      .select('earned_at')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(1);

    if (data?.[0]) {
      const lastBadgeTime = new Date(data[0].earned_at);
      const hourAgo = new Date(Date.now() - 3600000);
      setHasNewBadges(lastBadgeTime > hourAgo);
    }
  };

  const loadErrorQuestions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_question_stats')
      .select('id')
      .eq('user_id', user.id)
      .gt('error_count', 0)
      .eq('is_mastered', false);

    setQuestionsWithErrors(data?.length || 0);
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setNetworkError(null);

    try {
      await Promise.all([
        refreshData(),
        loadDailyChallenge(),
        checkForNewBadges(),
        loadErrorQuestions(),
      ]);
    } catch (_err) {
      setNetworkError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshData]);

  const handleStartTraining = (): void => {
    router.push('/training/free');
  };

  const handleDailyChallenge = (): void => {
    router.push('/training/daily-challenge');
  };

  const handleRevision = (): void => {
    router.push('/training/revision');
  };

  const handleNavigation = (route: string): void => {
    const validRoutes = ['/profile', '/training/config', '/training/daily-challenge', '/training/revision'];

    if (validRoutes.includes(route)) {
      router.push(route as any);
    } else {
      Alert.alert(
        'Bientôt disponible',
        'Cette fonctionnalité sera disponible dans une prochaine mise à jour !',
        [{ text: 'OK' }],
      );
    }
  };

  // Calculer les vraies statistiques
  const calculateStats = () => {
    const totalQuestions = stats.reduce((acc, s) => acc + s.total_questions, 0);
    const correctAnswers = stats.reduce((acc, s) => acc + s.correct_answers, 0);
    const successRate = totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

    const avgTime = stats.reduce((acc, s) => acc + Number(s.avg_time_per_question || 0), 0) / Math.max(stats.length, 1);

    return {
      successRate,
      avgTime: avgTime > 0 ? `${avgTime.toFixed(1)}s` : '0s',
      totalQuestions,
    };
  };

  const userStats = calculateStats();

  const handleProfile = (): void => {
    router.push('/profile');
  };

  if (isLoading && !profile) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Affichage des erreurs réseau */}
          {(networkError || error) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {networkError || error}
              </Text>
            </View>
          )}

          {/* Header avec profil */}
          <FadeInView duration={600} delay={0}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.profileSection}
                onPress={handleProfile}
                activeOpacity={0.8}
              >
                <View style={styles.avatarContainer}>
                  {profile?.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.defaultAvatar]}>
                      <Ionicons name="person" size={24} color={theme.colors.white} />
                    </View>
                  )}
                  {profile && profile.streak_days > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>🔥 {profile.streak_days}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.username}>{profile?.username ?? 'Pompier'}</Text>
                  <View style={styles.gradeBadge}>
                    <LinearGradient
                      colors={[currentGrade.color, `${currentGrade.color}DD`]}
                      style={styles.gradeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.gradeIcon}>{currentGrade.icon}</Text>
                      <Text style={styles.gradeName}>{currentGrade.name}</Text>
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => handleNavigation('/notifications')}
              >
                <Ionicons name="notifications-outline" size={24} color={theme.colors.white} />
                {hasNewBadges && <View style={styles.notificationBadge} />}
              </TouchableOpacity>
            </View>
          </FadeInView>

          {/* Progression vers le prochain grade */}
          {nextGrade && (
            <FadeInView duration={600} delay={100}>
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.pointsText}>
                    {(profile?.total_points ?? 0).toLocaleString()} points
                  </Text>
                  <Text style={styles.nextGradeText}>
                    Prochain: {nextGrade.name}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={['#DC2626', '#EF4444']}
                      style={[styles.progressBarFill, { width: `${progressToNextGrade}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {Math.round(progressToNextGrade)}%
                  </Text>
                </View>
              </View>
            </FadeInView>
          )}

          {/* Section Actualités */}
          <FadeInView duration={600} delay={150}>
            <View style={styles.newsSection}>
              <Text style={styles.newsSectionTitle}>📰 Actualités</Text>
              <TouchableOpacity style={styles.newsCard}>
                <Text style={styles.newsTitle}>🎯 Nouveau défi hebdomadaire</Text>
                <Text style={styles.newsDescription}>
                  Complétez 50 questions cette semaine pour gagner un badge exclusif !
                </Text>
                <Text style={styles.newsDate}>Il y a 2 heures</Text>
              </TouchableOpacity>

              {hasNewBadges && (
                <TouchableOpacity
                  style={styles.newsCard}
                  onPress={() => router.push('/profile')}
                >
                  <Text style={styles.newsTitle}>🏆 Nouveau badge débloqué !</Text>
                  <Text style={styles.newsDescription}>
                    Consultez votre profil pour voir vos nouveaux badges
                  </Text>
                  <Text style={styles.newsDate}>Récemment</Text>
                </TouchableOpacity>
              )}
            </View>
          </FadeInView>

          {/* Card Entraînement Libre */}
          <FadeInView duration={600} delay={200}>
            <TouchableOpacity
              style={styles.mainCard}
              onPress={handleStartTraining}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#DC2626', '#B91C1C']}
                style={styles.mainCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.mainCardContent}>
                  <Text style={styles.mainCardIcon}>🎯</Text>
                  <Text style={styles.mainCardTitle}>Entraînement Libre</Text>
                  <Text style={styles.mainCardSubtitle}>
                    Choisissez vos thèmes et paramètres
                  </Text>
                  <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>COMMENCER</Text>
                    <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>

          {/* Card Mode Révision */}
          {questionsWithErrors > 0 && (
            <FadeInView duration={600} delay={250}>
              <TouchableOpacity
                style={styles.revisionCard}
                onPress={handleRevision}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.revisionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.challengeContent}>
                    <View style={styles.challengeLeft}>
                      <Text style={styles.challengeIcon}>📚</Text>
                      <View>
                        <Text style={styles.challengeTitle}>Mode Révision</Text>
                        <Text style={styles.challengeSubtitle}>
                          {questionsWithErrors} questions à revoir
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </FadeInView>
          )}

          {/* Card Défi Quotidien */}
          <FadeInView duration={600} delay={300}>
            <TouchableOpacity
              style={[
                styles.challengeCard,
                dailyChallengeCompleted && styles.challengeCompleted,
              ]}
              onPress={handleDailyChallenge}
              activeOpacity={dailyChallengeCompleted ? 1 : 0.9}
              disabled={dailyChallengeCompleted}
            >
              <LinearGradient
                colors={dailyChallengeCompleted
                  ? ['#10B981', '#059669']
                  : ['#1E293B', '#334155']
                }
                style={styles.challengeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.challengeContent}>
                  <View style={styles.challengeLeft}>
                    <Text style={styles.challengeIcon}>
                      {dailyChallengeCompleted ? '✅' : '⚡'}
                    </Text>
                    <View>
                      <Text style={styles.challengeTitle}>Défi Quotidien</Text>
                      <Text style={styles.challengeSubtitle}>
                        {dailyChallengeCompleted
                          ? 'Complété ! Revenez demain'
                          : dailyChallenge
                            ? `${dailyChallenge.questions_count} questions - ${dailyChallenge.theme}`
                            : '20 questions mixtes'
                        }
                      </Text>
                    </View>
                  </View>
                  {!dailyChallengeCompleted && (
                    <View style={styles.challengeReward}>
                      <Text style={styles.rewardText}>
                        +{dailyChallenge?.reward_points || 50}
                      </Text>
                      <Text style={styles.rewardLabel}>points</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>

          {/* Stats réelles */}
          <FadeInView duration={600} delay={400}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{userStats.successRate}%</Text>
                <Text style={styles.statLabel}>Taux de réussite</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{userStats.avgTime}</Text>
                <Text style={styles.statLabel}>Temps moyen</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.statValue}>{userStats.totalQuestions}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
            </View>
          </FadeInView>

        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
