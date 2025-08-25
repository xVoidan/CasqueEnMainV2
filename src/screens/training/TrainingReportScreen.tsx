import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
  Dimensions,
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
import { getProgressToNext, formatPoints, FIREFIGHTER_GRADES } from '../../utils/grades';

const { width } = Dimensions.get('window');

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
    if (stats.successRate >= 80) {
      setShowCelebration(true);
    }
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

  const shareResults = async () => {
    try {
      const message = '🎯 Résultats de ma session d\'entraînement CasqueEnMains:\n\n' +
        `📊 Score: ${stats.totalScore.toFixed(0)} points\n` +
        `✅ Réussite: ${stats.successRate.toFixed(0)}%\n` +
        `📝 Questions: ${stats.correctAnswers}/${stats.totalQuestions} correctes\n` +
        `⏱️ Temps moyen: ${stats.averageTime.toFixed(0)}s par question\n\n` +
        '#CasqueEnMains #Pompiers #Formation';

      await Share.share({ message });
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

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
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
                              }
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

          {/* Badges */}
          {badges.filter(b => b.earned).length > 0 && (
            <FadeInView duration={600} delay={500}>
              <BadgeDisplay badges={badges} />
            </FadeInView>
          )}

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
                  onPress={shareResults}
                >
                  <Ionicons name="share-social" size={18} color={theme.colors.white} />
                  <Text style={styles.secondaryButtonText}>Partager</Text>
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
          {showDetails && (
            <FadeInView duration={400}>
              <View style={styles.detailsSection}>
                <Text style={styles.detailsSectionTitle}>Détail des réponses</Text>
                {questions.map((question, index) => {
                  const answer = sessionAnswers[index];
                  return (
                    <View key={question.id} style={styles.questionItem}>
                      <View style={styles.questionHeader}>
                        <Ionicons
                          name={answer.isCorrect ? 'checkmark-circle' : 'close-circle'}
                          size={18}
                          color={answer.isCorrect ? '#10B981' : '#EF4444'}
                        />
                        <Text style={styles.questionNumber}>Question {index + 1}</Text>
                        <Text style={styles.questionTime}>{answer.timeSpent.toFixed(0)}s</Text>
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