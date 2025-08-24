import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/store/AuthContext';

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
  answers: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
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

  useEffect(() => {
    calculateStats();
    saveSessionToHistory();
  }, []);

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
          total_points_earned: totalPoints || 0,
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
      const message = `🎯 Résultats de ma session d'entraînement CasqueEnMains:\n\n` +
        `📊 Score: ${stats.totalScore.toFixed(1)} points\n` +
        `✅ Réussite: ${stats.successRate.toFixed(1)}%\n` +
        `📝 Questions: ${stats.correctAnswers}/${stats.totalQuestions} correctes\n` +
        `⏱️ Temps moyen: ${stats.averageTime.toFixed(1)}s par question\n\n` +
        `#CasqueEnMains #Pompiers #Formation`;

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

  const getGradeEmoji = (rate: number): string => {
    if (rate >= 90) return '🏆';
    if (rate >= 75) return '⭐';
    if (rate >= 60) return '✅';
    if (rate >= 40) return '💪';
    return '📚';
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
                colors={['rgba(139, 92, 246, 0.2)', 'rgba(139, 92, 246, 0.05)']}
                style={styles.scoreGradient}
              >
                <Text style={styles.gradeEmoji}>
                  {getGradeEmoji(stats.successRate)}
                </Text>
                <Text style={styles.scoreValue}>
                  {stats.totalScore.toFixed(1)}
                </Text>
                <Text style={styles.scoreLabel}>POINTS</Text>
                <View style={styles.successRateContainer}>
                  <Text style={[styles.successRate, { color: getScoreColor(stats.successRate) }]}>
                    {stats.successRate.toFixed(1)}% de réussite
                  </Text>
                </View>
                <Text style={styles.gradeMessage}>
                  {getGradeMessage(stats.successRate)}
                </Text>
              </LinearGradient>
            </View>
          </FadeInView>

          {/* Statistiques détaillées */}
          <FadeInView duration={600} delay={400}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{stats.correctAnswers}</Text>
                <Text style={styles.statLabel}>Correctes</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                </View>
                <Text style={styles.statValue}>{stats.incorrectAnswers}</Text>
                <Text style={styles.statLabel}>Incorrectes</Text>
              </View>

              {stats.partialAnswers > 0 && (
                <View style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Ionicons name="remove-circle" size={24} color="#F59E0B" />
                  </View>
                  <Text style={styles.statValue}>{stats.partialAnswers}</Text>
                  <Text style={styles.statLabel}>Partielles</Text>
                </View>
              )}

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}>
                  <Ionicons name="time" size={24} color="#6B7280" />
                </View>
                <Text style={styles.statValue}>{stats.averageTime.toFixed(1)}s</Text>
                <Text style={styles.statLabel}>Temps moy.</Text>
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

          {/* Boutons d'action */}
          <FadeInView duration={600} delay={600}>
            <View style={styles.actionButtons}>
              {(stats.incorrectAnswers > 0 || questionsToReview.length > 0) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.reviewButton]}
                  onPress={handleReviewErrors}
                >
                  <Ionicons name="school" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    Mode Rattrapage ({stats.incorrectAnswers + questionsToReview.length})
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.detailsButton]}
                onPress={() => setShowDetails(!showDetails)}
              >
                <Ionicons 
                  name={showDetails ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color="#8B5CF6" 
                />
                <Text style={[styles.actionButtonText, { color: '#8B5CF6' }]}>
                  {showDetails ? 'Masquer' : 'Voir'} les détails
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton]}
                onPress={shareResults}
              >
                <Ionicons name="share-social" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Partager</Text>
              </TouchableOpacity>
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
                  colors={['#8B5CF6', '#7C3AED']}
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
  gradeEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
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
  navigationButtons: {
    gap: theme.spacing.md,
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