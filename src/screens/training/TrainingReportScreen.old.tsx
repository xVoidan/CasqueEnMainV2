import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
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
import { BadgeDisplay, calculateBadges } from '../../components/badges/BadgeDisplay';
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

  const sessionAnswers: ISessionAnswer[] = params.sessionAnswers
    ? JSON.parse(params.sessionAnswers as string)
    : [];
  const questions: IQuestion[] = params.questions
    ? JSON.parse(params.questions as string)
    : [];
  const config: ISessionConfig = params.config
    ? JSON.parse(params.config as string)
    : { scoring: { correct: 1, incorrect: 0, skipped: 0, partial: 0.5 } };
  const questionsToReview: string[] = params.questionsToReview
    ? JSON.parse(params.questionsToReview as string)
    : [];
  const totalPoints: number = params.totalPoints
    ? parseInt(params.totalPoints as string)
    : 0;

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

  useEffect(() => {
    calculateStats();
    saveSessionToHistory();
    fetchUserPoints();
  }, []);

  useEffect(() => {
    // Show celebration for high scores
    if (stats.successRate >= 80) {
      setShowCelebration(true);
    }
    // Calculate badges
    const earnedBadges = calculateBadges(stats, []);
    setBadges(earnedBadges);
  }, [stats]);

  useEffect(() => {
    if (userTotalPoints > 0) {
      const progress = getProgressToNext(userTotalPoints);
      setGradeProgress(progress);
    }
  }, [userTotalPoints]);

  const fetchUserPoints = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        // Points actuels plus les points gagnés dans cette session
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
    const totalTime = sessionAnswers.reduce((sum, a) => sum + (a?.timeSpent || 0), 0);
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
      // Sauvegarder dans Supabase
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

      // Sauvegarder localement pour l'historique
      const historyKey = `@training_history_${user.id}`;
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];

      history.unshift({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        stats,
        config,
      });

      // Garder seulement les 50 dernières sessions
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

  const shareResults = async () => {
    try {
      const message = '🎯 Résultats de ma session d\'entraînement CasqueEnMains:\n\n' +
        `📊 Score: ${stats.totalScore.toFixed(1)} points\n` +
        `✅ Réussite: ${stats.successRate.toFixed(1)}%\n` +
        `📝 Questions: ${stats.correctAnswers}/${stats.totalQuestions} correctes\n` +
        `⏱️ Temps moyen: ${stats.averageTime.toFixed(1)}s par question\n\n` +
        '#CasqueEnMains #Pompiers #Formation';

      await Share.share({ message });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleReviewErrors = () => {
    // Récupérer les questions à revoir (incorrectes + marquées)
    const questionsForReview = questions.filter((q, index) => {
      const answer = sessionAnswers[index];
      return (answer && !answer.isCorrect) || questionsToReview.includes(q.id);
    });

    // Créer une configuration spéciale pour le Mode Rattrapage
    const reviewConfig = {
      ...config,
      isReviewMode: true,
      allowNavigation: true, // Permet de naviguer entre les questions
      showCorrectAnswers: true, // Montre les bonnes réponses après validation
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

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Celebration Animation */}
        <CelebrationAnimation
          visible={showCelebration}
          type="confetti"
          onComplete={() => setShowCelebration(false)}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <FadeInView duration={600} delay={0}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Résultats de la session</Text>
              <Text style={styles.headerSubtitle}>
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </FadeInView>

          {/* Score principal */}
          <FadeInView duration={600} delay={200}>
            <View style={styles.mainScoreCard}>
              <LinearGradient
                colors={['rgba(220, 38, 38, 0.2)', 'rgba(220, 38, 38, 0.05)']}
                style={styles.scoreGradient}
              >
                <View style={styles.scoreHeader}>
                  <CircularProgress
                    percentage={stats.successRate}
                    size={140}
                    strokeWidth={12}
                    color={getScoreColor(stats.successRate)}
                  />
                  <View style={styles.scoreDetails}>
                    <Text style={styles.scoreValue}>
                      {stats.totalScore.toFixed(1)}
                    </Text>
                    <Text style={styles.scoreLabel}>POINTS</Text>
                  </View>
                </View>

                {/* Barème détaillé */}
                <View style={styles.scoringBreakdown}>
                  <Text style={styles.scoringTitle}>DÉTAIL DU CALCUL</Text>
                  <View style={styles.scoringContent}>
                    <View style={styles.scoringRow}>
                      <View style={styles.scoringLeft}>
                        <Text style={styles.scoringLabel}>Total questions</Text>
                      </View>
                      <View style={styles.scoringRight}>
                        <Text style={styles.scoringValue}>{stats.totalQuestions}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.scoringDivider} />
                    
                    <View style={styles.scoringRow}>
                      <View style={styles.scoringLeft}>
                        <View style={styles.scoringIcon}>
                          <Text style={styles.iconGreen}>✓</Text>
                        </View>
                        <Text style={styles.scoringLabelGreen}>Correctes</Text>
                      </View>
                      <View style={styles.scoringRight}>
                        <Text style={styles.scoringCalculation}>{stats.correctAnswers} × {config.scoring.correct}</Text>
                        <Text style={styles.scoringResultGreen}>+{(stats.correctAnswers * config.scoring.correct).toFixed(1)}</Text>
                      </View>
                    </View>
                    
                    {stats.incorrectAnswers > 0 && (
                      <View style={styles.scoringRow}>
                        <View style={styles.scoringLeft}>
                          <View style={styles.scoringIcon}>
                            <Text style={styles.iconRed}>✗</Text>
                          </View>
                          <Text style={styles.scoringLabelRed}>Incorrectes</Text>
                        </View>
                        <View style={styles.scoringRight}>
                          <Text style={styles.scoringCalculation}>{stats.incorrectAnswers} × {config.scoring.incorrect}</Text>
                          <Text style={styles.scoringResultRed}>{(stats.incorrectAnswers * config.scoring.incorrect).toFixed(1)}</Text>
                        </View>
                      </View>
                    )}
                    
                    {stats.skippedAnswers > 0 && (
                      <View style={styles.scoringRow}>
                        <View style={styles.scoringLeft}>
                          <View style={styles.scoringIcon}>
                            <Text style={styles.iconGray}>○</Text>
                          </View>
                          <Text style={styles.scoringLabelGray}>Passées</Text>
                        </View>
                        <View style={styles.scoringRight}>
                          <Text style={styles.scoringCalculation}>{stats.skippedAnswers} × {config.scoring.skipped}</Text>
                          <Text style={styles.scoringResultGray}>{(stats.skippedAnswers * config.scoring.skipped).toFixed(1)}</Text>
                        </View>
                      </View>
                    )}
                    
                    <View style={styles.scoringTotalDivider} />
                    
                    <View style={styles.scoringRow}>
                      <View style={styles.scoringLeft}>
                        <Text style={styles.scoringTotalLabel}>SCORE FINAL</Text>
                      </View>
                      <View style={styles.scoringRight}>
                        <Text style={styles.scoringTotalValue}>{stats.totalScore.toFixed(1)} pts</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.gradeMessage}>
                  {getGradeMessage(stats.successRate)}
                </Text>
              </LinearGradient>
            </View>
          </FadeInView>

          {/* Progression des grades */}
          {gradeProgress && (
            <FadeInView duration={600} delay={300}>
              <View style={styles.gradeProgressCard}>
                <LinearGradient
                  colors={['rgba(220, 38, 38, 0.15)', 'rgba(220, 38, 38, 0.05)']}
                  style={styles.gradeProgressGradient}
                >
                  <View style={styles.gradeHeader}>
                    <Text style={styles.gradeTitle}>PROGRESSION DES GRADES</Text>
                    <View style={styles.pointsEarnedBadge}>
                      <Text style={styles.pointsEarnedText}>+{Math.round(totalPoints || 0)} pts</Text>
                    </View>
                  </View>

                  <View style={styles.gradeContent}>
                    <View style={styles.currentGradeSection}>
                      <View style={[styles.gradeIcon, { backgroundColor: gradeProgress.currentGrade.backgroundColor }]}>
                        <Text style={styles.gradeIconText}>{gradeProgress.currentGrade.icon}</Text>
                      </View>
                      <View style={styles.gradeInfo}>
                        <Text style={styles.gradeName}>{gradeProgress.currentGrade.name}</Text>
                        <Text style={styles.gradePoints}>{formatPoints(userTotalPoints)} pts</Text>
                      </View>
                    </View>

                    {gradeProgress.nextGrade && (
                      <>
                        <View style={styles.progressBarContainer}>
                          <View style={styles.progressBarBackground}>
                            <View 
                              style={[
                                styles.progressBarFill, 
                                { 
                                  width: `${gradeProgress.progress}%`,
                                  backgroundColor: gradeProgress.currentGrade.color 
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressPercentage}>{gradeProgress.progress.toFixed(0)}%</Text>
                        </View>

                        <View style={styles.nextGradeSection}>
                          <Text style={styles.nextGradeLabel}>Prochain grade</Text>
                          <View style={styles.nextGradeInfo}>
                            <View style={[styles.nextGradeIcon, { backgroundColor: gradeProgress.nextGrade.backgroundColor }]}>
                              <Text style={styles.nextGradeIconText}>{gradeProgress.nextGrade.icon}</Text>
                            </View>
                            <View>
                              <Text style={styles.nextGradeName}>{gradeProgress.nextGrade.name}</Text>
                              <Text style={styles.nextGradePoints}>
                                Encore {formatPoints(gradeProgress.pointsNeeded)} pts
                              </Text>
                            </View>
                          </View>
                        </View>
                      </>
                    )}

                    {!gradeProgress.nextGrade && (
                      <View style={styles.maxGradeSection}>
                        <Ionicons name="trophy" size={24} color="#FFD700" style={{ marginRight: 8 }} />
                        <Text style={styles.maxGradeText}>Grade maximum atteint !</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </FadeInView>
          )}

          {/* Statistiques temporelles */}
          <FadeInView duration={600} delay={400}>
            <View style={styles.timeStatsCard}>
              <Text style={styles.timeStatsTitle}>Performance temporelle</Text>
              <View style={styles.timeStatsGrid}>
                <View style={styles.timeStatItem}>
                  <Ionicons name="timer-outline" size={24} color={modalTheme.colors.info} />
                  <Text style={styles.timeStatValue}>{stats.averageTime.toFixed(1)}s</Text>
                  <Text style={styles.timeStatLabel}>Temps moyen</Text>
                </View>
                <View style={styles.timeStatDivider} />
                <View style={styles.timeStatItem}>
                  <Ionicons name="time-outline" size={24} color={modalTheme.colors.warning} />
                  <Text style={styles.timeStatValue}>{Math.floor(stats.totalTime / 60)}:{(stats.totalTime % 60).toString().padStart(2, '0')}</Text>
                  <Text style={styles.timeStatLabel}>Durée totale</Text>
                </View>
                <View style={styles.timeStatDivider} />
                <View style={styles.timeStatItem}>
                  <Ionicons name="speedometer-outline" size={24} color={modalTheme.colors.success} />
                  <Text style={styles.timeStatValue}>
                    {stats.averageTime < 5 ? 'Rapide' : stats.averageTime < 10 ? 'Moyen' : 'Lent'}
                  </Text>
                  <Text style={styles.timeStatLabel}>Rythme</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Détails des questions */}
          {showDetails && (
            <FadeInView duration={600} delay={0}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Détail des réponses</Text>
                {questions.map((question, index) => {
                  const answer = sessionAnswers[index];
                  return (
                    <View key={question.id} style={styles.questionDetail}>
                      <View style={styles.questionHeader}>
                        <Ionicons
                          name={answer.isCorrect ? 'checkmark-circle' : 'close-circle'}
                          size={20}
                          color={answer.isCorrect ? '#10B981' : '#EF4444'}
                        />
                        <Text style={styles.questionNumber}>Question {index + 1}</Text>
                        <Text style={styles.questionTime}>{answer.timeSpent.toFixed(1)}s</Text>
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

          {/* Badges */}
          {badges.filter(b => b.earned).length > 0 && (
            <FadeInView duration={600} delay={500}>
              <BadgeDisplay badges={badges} />
            </FadeInView>
          )}

          {/* Card d'actions regroupées */}
          <FadeInView duration={600} delay={600}>
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Actions disponibles</Text>

              {(stats.incorrectAnswers > 0 || questionsToReview.length > 0) && (
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={handleReviewErrors}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={modalTheme.gradients.secondary}
                    style={styles.primaryActionGradient}
                  >
                    <Ionicons name="school" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>
                      Mode Rattrapage ({stats.incorrectAnswers + questionsToReview.length})
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => setShowDetails(!showDetails)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={showDetails ? 'eye-off' : 'eye'}
                    size={20}
                    color={modalTheme.colors.primary}
                  />
                  <Text style={styles.secondaryActionText}>
                    {showDetails ? 'Masquer' : 'Détails'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={shareResults}
                  activeOpacity={0.8}
                >
                  <Ionicons name="share-social" size={20} color={modalTheme.colors.info} />
                  <Text style={styles.secondaryActionText}>Partager</Text>
                </TouchableOpacity>
              </View>
            </View>
          </FadeInView>

          {/* Boutons de navigation */}
          <FadeInView duration={600} delay={800}>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                style={styles.newSessionButton}
                onPress={handleNewSession}
              >
                <LinearGradient
                  colors={modalTheme.gradients.primary}
                  style={styles.gradientButton}
                >
                  <Ionicons name="refresh" size={24} color="#FFFFFF" />
                  <Text style={styles.newSessionText}>Nouvelle session</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={handleBackToHome}
              >
                <Ionicons name="home" size={20} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.homeButtonText}>Accueil</Text>
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
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  mainScoreCard: {
    marginBottom: theme.spacing.xl,
  },
  scoreGradient: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  scoreDetails: {
    alignItems: 'center',
  },
  gradeEmoji: {
    fontSize: 48,
    position: 'absolute',
    top: -20,
    zIndex: 1,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  scoreLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 2,
    marginTop: theme.spacing.xs,
  },
  scoringBreakdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  scoringTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  scoringContent: {
    padding: theme.spacing.lg,
  },
  scoringRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  scoringLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scoringRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoringIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  iconGreen: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: 'bold',
  },
  iconRed: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  iconGray: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 'bold',
  },
  scoringDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: theme.spacing.xs,
  },
  scoringTotalDivider: {
    height: 2,
    backgroundColor: modalTheme.colors.primary,
    marginVertical: theme.spacing.md,
    opacity: 0.3,
  },
  scoringLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  scoringLabelGreen: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  scoringLabelRed: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  scoringLabelGray: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  scoringCalculation: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '400',
    marginRight: theme.spacing.md,
  },
  scoringValue: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: '600',
  },
  scoringResultGreen: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  scoringResultRed: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '700',
  },
  scoringResultGray: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
  },
  scoringTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  scoringTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: modalTheme.colors.primary,
  },
  successRateContainer: {
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.full,
  },
  successRate: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  gradeMessage: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    marginTop: theme.spacing.md,
  },
  gradeProgressCard: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  gradeProgressGradient: {
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.xl,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  gradeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5,
  },
  pointsEarnedBadge: {
    backgroundColor: modalTheme.colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
  },
  pointsEarnedText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gradeContent: {
    // gap non supporté partout, utilisons marginBottom
  },
  currentGradeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gradeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  gradeIconText: {
    fontSize: 28,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  gradePoints: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressBarContainer: {
    marginVertical: theme.spacing.md,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 4,
  },
  nextGradeSection: {
    marginTop: theme.spacing.sm,
  },
  nextGradeLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nextGradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  nextGradeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  nextGradeIconText: {
    fontSize: 20,
  },
  nextGradeName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 2,
  },
  nextGradePoints: {
    fontSize: 12,
    color: modalTheme.colors.warning,
  },
  maxGradeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  maxGradeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  timeStatsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeStatsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: theme.spacing.lg,
  },
  timeStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  timeStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: theme.spacing.sm,
  },
  timeStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginVertical: theme.spacing.xs,
  },
  timeStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  detailsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  questionDetail: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  questionNumber: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  questionTime: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  questionText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    minWidth: '48%',
    justifyContent: 'center',
  },
  reviewButton: {
    backgroundColor: '#EF4444',
  },
  detailsButton: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionsCard: {
    backgroundColor: modalTheme.colors.surface,
    borderRadius: modalTheme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: modalTheme.colors.border,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: modalTheme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  primaryAction: {
    marginBottom: theme.spacing.md,
    borderRadius: modalTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: modalTheme.colors.surfaceLight,
    borderRadius: modalTheme.borderRadius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: modalTheme.colors.borderLight,
    marginHorizontal: 4,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: modalTheme.colors.textSecondary,
  },
  navigationButtons: {
    marginTop: theme.spacing.md,
  },
  newSessionButton: {
    marginBottom: theme.spacing.md,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  newSessionText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
  },
  homeButtonText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
