import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
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

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { } = useAuth();
  const {
    profile,
    currentGrade,
    nextGrade,
    progressToNextGrade,
    dailyChallengeCompleted,
    isLoading,
    refreshData,
  } = useUserData();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleStartTraining = () => {
    router.push('/training/config');
  };

  const handleDailyChallenge = () => {
    router.push('/training/daily-challenge');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  if (isLoading && !profile) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
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
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
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
                  <Text style={styles.username}>{profile?.username || 'Pompier'}</Text>
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
                style={styles.settingsButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={24} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          </FadeInView>

          {/* Progression vers le prochain grade */}
          {nextGrade && (
            <FadeInView duration={600} delay={100}>
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.pointsText}>
                    {(profile?.total_points || 0).toLocaleString()} points
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
                          : '20 questions mixtes - Sans limite de temps'
                        }
                      </Text>
                    </View>
                  </View>
                  {!dailyChallengeCompleted && (
                    <View style={styles.challengeReward}>
                      <Text style={styles.rewardText}>+50</Text>
                      <Text style={styles.rewardLabel}>points</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </FadeInView>

          {/* Stats rapides */}
          <FadeInView duration={600} delay={400}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>85%</Text>
                <Text style={styles.statLabel}>Taux de réussite</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#3B82F6" />
                <Text style={styles.statValue}>4.2s</Text>
                <Text style={styles.statLabel}>Temps moyen</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.statValue}>342</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
            </View>
          </FadeInView>

          {/* Actions rapides */}
          <FadeInView duration={600} delay={500}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/leaderboard')}
              >
                <Ionicons name="podium" size={20} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Classement</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/stats')}
              >
                <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Statistiques</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/achievements')}
              >
                <Ionicons name="medal" size={20} color={theme.colors.primary} />
                <Text style={styles.actionButtonText}>Succès</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

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
  settingsButton: {
    padding: theme.spacing.sm,
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
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
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
    opacity: 0.8,
  },
});

