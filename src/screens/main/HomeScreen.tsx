import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/AuthContext';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';

// Constantes des grades pompier
const GRADES = [
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

interface IUserStats {
  totalPoints: number;
  currentGrade: typeof GRADES[0];
  nextGrade: typeof GRADES[0] | null;
  progressToNextGrade: number;
  streakDays: number;
  dailyChallengeCompleted: boolean;
  username: string;
  avatarUrl?: string;
}

export function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const [userStats, setUserStats] = useState<IUserStats>({
    totalPoints: 1250,
    currentGrade: GRADES[4],
    nextGrade: GRADES[5],
    progressToNextGrade: 62.5,
    streakDays: 7,
    dailyChallengeCompleted: false,
    username: user?.user_metadata?.username ?? 'Pompier',
    avatarUrl: user?.user_metadata?.avatar_url,
  });

  const getCurrentGrade = (points: number): { current: typeof GRADES[0]; next: typeof GRADES[0] | null; progress: number } => {
    for (let i = GRADES.length - 1; i >= 0; i--) {
      if (points >= GRADES[i].minPoints) {
        return {
          current: GRADES[i],
          next: i < GRADES.length - 1 ? GRADES[i + 1] : null,
          progress: GRADES[i + 1]
            ? ((points - GRADES[i].minPoints) / (GRADES[i + 1].minPoints - GRADES[i].minPoints)) * 100
            : 100,
        };
      }
    }
    return { current: GRADES[0], next: GRADES[1], progress: 0 };
  };

  useEffect(() => {
    // Charger les stats utilisateur depuis Supabase
    const loadUserStats = async () => {
      if (!user?.id || isGuest) return;
      
      // TODO: Récupérer les vraies stats depuis Supabase
      const gradeInfo = getCurrentGrade(userStats.totalPoints);
      setUserStats(prev => ({
        ...prev,
        currentGrade: gradeInfo.current,
        nextGrade: gradeInfo.next,
        progressToNextGrade: gradeInfo.progress,
      }));
    };

    void loadUserStats();
  }, [user, isGuest]);

  const handleStartTraining = () => {
    router.push('/training/config');
  };

  const handleDailyChallenge = () => {
    router.push('/training/daily-challenge');
  };

  const handleProfile = () => {
    router.push('/profile');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
                  {userStats.avatarUrl ? (
                    <Image 
                      source={{ uri: userStats.avatarUrl }} 
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.defaultAvatar]}>
                      <Ionicons name="person" size={24} color={theme.colors.white} />
                    </View>
                  )}
                  {userStats.streakDays > 0 && (
                    <View style={styles.streakBadge}>
                      <Text style={styles.streakText}>🔥 {userStats.streakDays}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{userStats.username}</Text>
                  <View style={styles.gradeBadge}>
                    <LinearGradient
                      colors={[userStats.currentGrade.color, userStats.currentGrade.color + 'DD']}
                      style={styles.gradeGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.gradeIcon}>{userStats.currentGrade.icon}</Text>
                      <Text style={styles.gradeName}>{userStats.currentGrade.name}</Text>
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
          {userStats.nextGrade && (
            <FadeInView duration={600} delay={100}>
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.pointsText}>
                    {userStats.totalPoints.toLocaleString()} points
                  </Text>
                  <Text style={styles.nextGradeText}>
                    Prochain: {userStats.nextGrade.name}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBg}>
                    <LinearGradient
                      colors={['#DC2626', '#EF4444']}
                      style={[styles.progressBarFill, { width: `${userStats.progressToNextGrade}%` }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <Text style={styles.progressPercentage}>
                    {Math.round(userStats.progressToNextGrade)}%
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
                userStats.dailyChallengeCompleted && styles.challengeCompleted
              ]}
              onPress={handleDailyChallenge}
              activeOpacity={userStats.dailyChallengeCompleted ? 1 : 0.9}
              disabled={userStats.dailyChallengeCompleted}
            >
              <LinearGradient
                colors={userStats.dailyChallengeCompleted 
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
                      {userStats.dailyChallengeCompleted ? '✅' : '⚡'}
                    </Text>
                    <View>
                      <Text style={styles.challengeTitle}>Défi Quotidien</Text>
                      <Text style={styles.challengeSubtitle}>
                        {userStats.dailyChallengeCompleted 
                          ? 'Complété ! Revenez demain'
                          : '20 questions mixtes - Sans limite de temps'
                        }
                      </Text>
                    </View>
                  </View>
                  {!userStats.dailyChallengeCompleted && (
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
});