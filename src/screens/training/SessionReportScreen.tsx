// Performance optimized
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/common/GradientBackground';
import { Button } from '../../components/common/Button';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';
import { useAuth } from '../../store/AuthContext';

interface ISessionAnswer {
  questionId: string;
  selectedAnswers: string[];
  timeSpent: number;
  isCorrect: boolean;
  isPartial?: boolean;
  isSkipped: boolean;
}

interface ISessionConfig {
  themes: any[];
  questionCount: number;
  timerEnabled: boolean;
  timerDuration: number | null;
  scoring: {
    correct: number;
    incorrect: number;
    skipped: number;
    partial: number;
  };
}

interface IPointsBreakdown {
  basePoints: number;
  performanceBonus: number;
  speedBonus: number;
  streakBonus: number;
  totalPoints: number;
}

// Grades pompier
const GRADES = [
  { name: 'Aspirant', minPoints: 0, color: '#9CA3AF', icon: '🎓' },
  { name: 'Sapeur 2ème classe', minPoints: 100, color: '#6B7280', icon: '⭐' },
  { name: 'Sapeur 1ère classe', minPoints: 250, color: '#4B5563', icon: '⭐⭐' },
  { name: 'Caporal', minPoints: 500, color: '#EF4444', icon: '🔸' },
  { name: 'Caporal-chef', minPoints: 1000, color: '#DC2626', icon: '🔸🔸' },
];

export function SessionReportScreen(): React.ReactElement {
  const router = useRouter();
  const { user: _user } = useAuth();
  const params = useLocalSearchParams();

  const sessionAnswers: ISessionAnswer[] = params.sessionAnswers
    ? JSON.parse(params.sessionAnswers as string)
    : [];
  const config: ISessionConfig = params.config
    ? JSON.parse(params.config as string)
    : null;
  const questions = params.questions
    ? JSON.parse(params.questions as string)
    : [];

  const [scoreAnimation] = useState(new Animated.Value(0));
  const [pointsAnimation] = useState(new Animated.Value(0));
  const [showGradeUp, setShowGradeUp] = useState(false);

  // Calculer les statistiques
  const calculateStats = () => {
    const correct = sessionAnswers.filter(a => a.isCorrect).length;
    const partial = sessionAnswers.filter(a => a.isPartial).length;
    const incorrect = sessionAnswers.filter(a => !a.isCorrect && !a.isPartial && !a.isSkipped).length;
    const skipped = sessionAnswers.filter(a => a.isSkipped).length;
    const total = sessionAnswers.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;
    const averageTime = sessionAnswers.reduce((acc, a) => acc + a.timeSpent, 0) / total;

    return { correct, partial, incorrect, skipped, total, percentage, averageTime };
  };

  // Calculer les points
  const calculatePoints = (): IPointsBreakdown => {
    const stats = calculateStats();
    const scoring = config?.scoring || { correct: 10, incorrect: -2, skipped: 0, partial: 5 };

    // Points de base
    const basePoints =
      (stats.correct * scoring.correct) +
      (stats.partial * scoring.partial) +
      (stats.incorrect * scoring.incorrect) +
      (stats.skipped * scoring.skipped);

    // Bonus de performance
    let performanceBonus = 0;
    if (stats.percentage >= 80) {
      performanceBonus = basePoints * 0.5; // +50%
    } else if (stats.percentage >= 60) {
      performanceBonus = basePoints * 0.2; // +20%
    }

    // Bonus de vitesse (si moyenne < 5 secondes)
    const speedBonus = stats.averageTime < 5 ? 10 : 0;

    // Bonus de streak (TODO: récupérer depuis le profil)
    const streakDays = 7; // Exemple
    const streakBonus = streakDays >= 7 ? 15 : streakDays >= 3 ? 5 : 0;

    const totalPoints = Math.max(0, basePoints + performanceBonus + speedBonus + streakBonus);

    return { basePoints, performanceBonus, speedBonus, streakBonus, totalPoints };
  };

  const stats = calculateStats();
  const points = calculatePoints();

  // Vérifier si level up
  const checkLevelUp = () => {
    const currentPoints = 1250; // TODO: Récupérer depuis le profil
    const newPoints = currentPoints + points.totalPoints;

    const currentGrade = GRADES.find(g => currentPoints >= g.minPoints);
    const newGrade = GRADES.find(g => newPoints >= g.minPoints);

    if (newGrade && currentGrade && newGrade.minPoints > currentGrade.minPoints) {
      setShowGradeUp(true);
      return newGrade;
    }
    return null;
  };

  useEffect(() => {
    // Animations
    Animated.parallel([
      Animated.timing(scoreAnimation, {
        toValue: stats.percentage,
        duration: 1500,
        useNativeDriver: false,
      }),
      Animated.timing(pointsAnimation, {
        toValue: points.totalPoints,
        duration: 2000,
        useNativeDriver: false,
      }),
    ]).start();

    // Vérifier le level up
    checkLevelUp();
  }, []);

  const handleViewCorrection = () => {
    router.push({
      pathname: '/training/correction',
      params: {
        sessionAnswers: JSON.stringify(sessionAnswers),
        questions: JSON.stringify(questions),
      },
    });
  };

  const handleNewSession = () => {
    router.push('/training/config');
  };

  const handleBackHome = () => {
    router.push('/home');
  };

  const getScoreColor = () => {
    if (stats.percentage >= 80) {return '#10B981';}
    if (stats.percentage >= 60) {return '#F59E0B';}
    return '#EF4444';
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score principal */}
          <FadeInView duration={800} delay={0}>
            <View style={styles.scoreCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                style={styles.scoreGradient}
              >
                <Text style={styles.scoreTitle}>Score final</Text>
                <Animated.Text style={[styles.scoreValue, { color: getScoreColor() }]}>
                  {scoreAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', `${Math.round(stats.percentage)}%`],
                  })}
                </Animated.Text>
                <View style={styles.scoreDetails}>
                  <View style={styles.scoreDetailItem}>
                    <View style={[styles.scoreDot, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.scoreDetailText}>
                      {stats.correct} correctes
                    </Text>
                  </View>
                  {stats.partial > 0 && (
                    <View style={styles.scoreDetailItem}>
                      <View style={[styles.scoreDot, { backgroundColor: '#F59E0B' }]} />
                      <Text style={styles.scoreDetailText}>
                        {stats.partial} partielles
                      </Text>
                    </View>
                  )}
                  <View style={styles.scoreDetailItem}>
                    <View style={[styles.scoreDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.scoreDetailText}>
                      {stats.incorrect} incorrectes
                    </Text>
                  </View>
                  {stats.skipped > 0 && (
                    <View style={styles.scoreDetailItem}>
                      <View style={[styles.scoreDot, { backgroundColor: '#6B7280' }]} />
                      <Text style={styles.scoreDetailText}>
                        {stats.skipped} non répondues
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          </FadeInView>

          {/* Points gagnés */}
          <FadeInView duration={800} delay={200}>
            <View style={styles.pointsCard}>
              <Text style={styles.pointsTitle}>XP gagné</Text>

              <View style={styles.pointsBreakdown}>
                <View style={styles.pointsRow}>
                  <Text style={styles.pointsLabel}>XP de base</Text>
                  <Text style={styles.pointsValue}>
                    {points.basePoints >= 0 ? '+' : ''}{points.basePoints.toFixed(1)}
                  </Text>
                </View>

                {points.performanceBonus > 0 && (
                  <View style={styles.pointsRow}>
                    <View style={styles.bonusLabel}>
                      <Ionicons name="trophy" size={16} color="#F59E0B" />
                      <Text style={[styles.pointsLabel, styles.bonusText]}>
                        Bonus performance ({stats.percentage >= 80 ? '>80%' : '>60%'})
                      </Text>
                    </View>
                    <Text style={[styles.pointsValue, styles.bonusValue]}>
                      +{points.performanceBonus.toFixed(1)}
                    </Text>
                  </View>
                )}

                {points.speedBonus > 0 && (
                  <View style={styles.pointsRow}>
                    <View style={styles.bonusLabel}>
                      <Ionicons name="flash" size={16} color="#3B82F6" />
                      <Text style={[styles.pointsLabel, styles.bonusText]}>
                        Bonus vitesse
                      </Text>
                    </View>
                    <Text style={[styles.pointsValue, styles.bonusValue]}>
                      +{points.speedBonus}
                    </Text>
                  </View>
                )}

                {points.streakBonus > 0 && (
                  <View style={styles.pointsRow}>
                    <View style={styles.bonusLabel}>
                      <Text style={styles.dynamicStyle1}>🔥</Text>
                      <Text style={[styles.pointsLabel, styles.bonusText]}>
                        Bonus streak
                      </Text>
                    </View>
                    <Text style={[styles.pointsValue, styles.bonusValue]}>
                      +{points.streakBonus}
                    </Text>
                  </View>
                )}

                <View style={styles.totalDivider} />

                <View style={styles.pointsRow}>
                  <Text style={styles.totalLabel}>TOTAL</Text>
                  <Animated.Text style={styles.totalValue}>
                    {pointsAnimation.interpolate({
                      inputRange: [0, points.totalPoints],
                      outputRange: ['0', `+${Math.round(points.totalPoints)}`],
                    })}
                  </Animated.Text>
                </View>
              </View>

              {/* Rappel du barème */}
              <View style={styles.scoringReminder}>
                <Text style={styles.scoringTitle}>Barème appliqué</Text>
                <View style={styles.scoringGrid}>
                  <View style={styles.scoringItem}>
                    <Text style={styles.scoringLabel}>Correct:</Text>
                    <Text style={styles.scoringValue}>
                      {config?.scoring.correct >= 0 ? '+' : ''}{config?.scoring.correct}
                    </Text>
                  </View>
                  <View style={styles.scoringItem}>
                    <Text style={styles.scoringLabel}>Incorrect:</Text>
                    <Text style={styles.scoringValue}>
                      {config?.scoring.incorrect >= 0 ? '+' : ''}{config?.scoring.incorrect}
                    </Text>
                  </View>
                  <View style={styles.scoringItem}>
                    <Text style={styles.scoringLabel}>Non répondu:</Text>
                    <Text style={styles.scoringValue}>
                      {config?.scoring.skipped >= 0 ? '+' : ''}{config?.scoring.skipped}
                    </Text>
                  </View>
                  <View style={styles.scoringItem}>
                    <Text style={styles.scoringLabel}>Partiel:</Text>
                    <Text style={styles.scoringValue}>
                      {config?.scoring.partial >= 0 ? '+' : ''}{config?.scoring.partial}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Level up notification */}
          {showGradeUp && (
            <FadeInView duration={800} delay={400}>
              <View style={styles.levelUpCard}>
                <LinearGradient
                  colors={['#F59E0B', '#DC2626']}
                  style={styles.levelUpGradient}
                >
                  <Text style={styles.levelUpIcon}>🎉</Text>
                  <Text style={styles.levelUpTitle}>NOUVEAU GRADE !</Text>
                  <Text style={styles.levelUpGrade}>Caporal</Text>
                  <Text style={styles.levelUpMessage}>
                    Félicitations pour votre progression !
                  </Text>
                </LinearGradient>
              </View>
            </FadeInView>
          )}

          {/* Statistiques supplémentaires */}
          <FadeInView duration={800} delay={600}>
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Statistiques</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={24} color="#3B82F6" />
                  <Text style={styles.statValue}>
                    {Math.round(stats.averageTime)}s
                  </Text>
                  <Text style={styles.statLabel}>Temps moyen</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.statValue}>
                    {stats.correct}/{stats.total}
                  </Text>
                  <Text style={styles.statLabel}>Réussite</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="trending-up" size={24} color="#F59E0B" />
                  <Text style={styles.statValue}>
                    {Math.round((stats.correct / Math.max(1, stats.total - stats.skipped)) * 100)}%
                  </Text>
                  <Text style={styles.statLabel}>Précision</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Actions */}
          <FadeInView duration={800} delay={800}>
            <View style={styles.actions}>
              <Button
                title="VOIR LA CORRECTION"
                onPress={handleViewCorrection}
                variant="primary"
                fullWidth
                size="large"
                style={styles.dynamicStyle2}
              />

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleNewSession}
                >
                  <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                  <Text style={styles.secondaryButtonText}>Nouvelle session</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleBackHome}
                >
                  <Ionicons name="home" size={20} color={theme.colors.primary} />
                  <Text style={styles.secondaryButtonText}>Accueil</Text>
                </TouchableOpacity>
              </View>
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
    paddingVertical: theme.spacing.xl,
  },
  scoreCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  scoreGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
    marginBottom: theme.spacing.lg,
  },
  scoreDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  scoreDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  scoreDetailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
  },
  pointsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  pointsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  pointsBreakdown: {
    gap: theme.spacing.sm,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  pointsLabel: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pointsValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
  },
  bonusLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bonusText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bonusValue: {
    color: '#F59E0B',
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: theme.spacing.sm,
  },
  totalLabel: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  totalValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: '#10B981',
  },
  scoringReminder: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoringTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: theme.spacing.sm,
  },
  scoringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  scoringItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  scoringLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  scoringValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  levelUpCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  levelUpGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  levelUpIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  levelUpTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  levelUpGrade: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  levelUpMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
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
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  actions: {
    marginTop: theme.spacing.lg,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
