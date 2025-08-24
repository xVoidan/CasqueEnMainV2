// Performance optimized with Supabase integration
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';
import { questionService, IQuestion } from '@/src/services/questionService';
import { useAuth } from '@/src/store/AuthContext';

// Types
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
  questionTypeFilter?: 'all' | 'single' | 'multiple';
}

interface ISessionAnswer {
  questionId: string;
  selectedAnswers: string[];
  timeSpent: number;
  isCorrect: boolean;
  isPartial?: boolean;
  isSkipped: boolean;
}

const SESSION_STORAGE_KEY = '@training_session_progress';

export function TrainingSessionScreenV2(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const { config } = useLocalSearchParams();
  const sessionConfig: ISessionConfig | null = config ? JSON.parse(config as string) : null;

  // États
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [sessionAnswers, setSessionAnswers] = useState<ISessionAnswer[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    sessionConfig?.timerEnabled ? sessionConfig.timerDuration : null
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionId] = useState(Date.now().toString());

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Calculs
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Charger les questions au démarrage
  useEffect(() => {
    loadQuestions();
    return () => {
      // Sauvegarder la progression en quittant
      if (questions.length > 0 && currentQuestionIndex < questions.length - 1) {
        saveProgress();
      }
    };
  }, []);

  const loadQuestions = async () => {
    if (!sessionConfig) {
      setError('Configuration de session invalide');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Préparer les filtres de thèmes
      const themeFilters = sessionConfig.themes.map((theme: any) => ({
        theme: theme.id,
        subThemes: theme.subThemes.map((st: any) => st.id),
      }));

      // Charger les questions depuis Supabase
      const loadedQuestions = await questionService.getQuestions(
        themeFilters,
        sessionConfig.questionCount,
        sessionConfig.questionTypeFilter || 'all'
      );

      if (loadedQuestions.length === 0) {
        setError('Aucune question trouvée pour les thèmes sélectionnés');
      } else {
        setQuestions(loadedQuestions);
        
        // Vérifier s'il y a une session sauvegardée
        await checkSavedProgress();
      }
    } catch (err) {
      console.error('Erreur chargement questions:', err);
      setError('Erreur lors du chargement des questions. Utilisation des questions d\'exemple.');
      
      // Utiliser les questions d'exemple en cas d'erreur
      const sampleQuestions = await questionService.getRandomQuestions(
        sessionConfig.questionCount > 0 ? sessionConfig.questionCount : 20
      );
      setQuestions(sampleQuestions);
    } finally {
      setLoading(false);
    }
  };

  const checkSavedProgress = async () => {
    if (!user) return;
    
    try {
      const savedProgress = await AsyncStorage.getItem(`${SESSION_STORAGE_KEY}_${user.id}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);
        
        // Vérifier si c'est une session récente (moins de 24h)
        const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24) {
          Alert.alert(
            'Session en cours',
            `Voulez-vous reprendre votre session précédente ? (Question ${parsed.currentQuestionIndex + 1}/${questions.length})`,
            [
              { 
                text: 'Non, nouvelle session', 
                onPress: () => clearSavedProgress(),
                style: 'cancel'
              },
              { 
                text: 'Reprendre', 
                onPress: () => {
                  setCurrentQuestionIndex(parsed.currentQuestionIndex);
                  setSessionAnswers(parsed.sessionAnswers);
                }
              },
            ],
          );
        } else {
          // Session trop ancienne, la supprimer
          clearSavedProgress();
        }
      }
    } catch (err) {
      console.error('Erreur restauration progression:', err);
    }
  };

  const saveProgress = async () => {
    if (!user || questions.length === 0) return;
    
    try {
      const progressData = {
        sessionId,
        currentQuestionIndex,
        sessionAnswers,
        timestamp: Date.now(),
        config: sessionConfig,
      };
      
      await AsyncStorage.setItem(
        `${SESSION_STORAGE_KEY}_${user.id}`,
        JSON.stringify(progressData)
      );
    } catch (err) {
      console.error('Erreur sauvegarde progression:', err);
    }
  };

  const clearSavedProgress = async () => {
    if (!user) return;
    
    try {
      await AsyncStorage.removeItem(`${SESSION_STORAGE_KEY}_${user.id}`);
    } catch (err) {
      console.error('Erreur suppression progression:', err);
    }
  };

  // Animation de la barre de progression
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Gestion du timer
  useEffect(() => {
    if (sessionConfig?.timerEnabled && timeRemaining !== null && !isPaused && !isValidated) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            handleValidate(true); // Auto-validation si temps écoulé
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, isPaused, isValidated, sessionConfig?.timerEnabled]);

  const toggleAnswer = (answerId: string) => {
    if (isValidated) return;

    if (currentQuestion?.type === 'single') {
      setSelectedAnswers([answerId]);
    } else {
      setSelectedAnswers(prev => {
        if (prev.includes(answerId)) {
          return prev.filter(id => id !== answerId);
        } else {
          return [...prev, answerId];
        }
      });
    }
  };

  const handleValidate = (isTimeout = false, isSkipped = false) => {
    if (!currentQuestion) return;

    const timeSpent = (Date.now() - questionStartTime) / 1000;

    // Calculer si la réponse est correcte
    const correctAnswerIds = currentQuestion.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);

    const isCorrect = !isSkipped && !isTimeout && currentQuestion.type === 'single'
      ? selectedAnswers.length === 1 && correctAnswerIds.includes(selectedAnswers[0])
      : !isSkipped && !isTimeout && correctAnswerIds.every(id => selectedAnswers.includes(id)) &&
        selectedAnswers.every(id => correctAnswerIds.includes(id));

    const isPartial = !isSkipped && !isTimeout && currentQuestion.type === 'multiple' &&
      !isCorrect &&
      selectedAnswers.some(id => correctAnswerIds.includes(id)) &&
      !selectedAnswers.some(id => !correctAnswerIds.includes(id));

    // Enregistrer la réponse
    const answer: ISessionAnswer = {
      questionId: currentQuestion.id,
      selectedAnswers: isTimeout || isSkipped ? [] : selectedAnswers,
      timeSpent,
      isCorrect,
      isPartial,
      isSkipped: isTimeout || isSkipped || selectedAnswers.length === 0,
    };

    setSessionAnswers(prev => [...prev, answer]);
    setIsValidated(true);

    // Sauvegarder la progression après chaque réponse
    saveProgress();

    // Ne pas passer automatiquement à la question suivante
    // L'utilisateur devra cliquer sur "Question suivante"
  };

  const handleSkip = () => {
    handleValidate(false, true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswers([]);
      setIsValidated(false);
      setQuestionStartTime(Date.now());
      if (sessionConfig?.timerEnabled) {
        setTimeRemaining(sessionConfig.timerDuration);
      }
      // Animation de progression
      Animated.timing(progressAnim, {
        toValue: ((currentQuestionIndex + 2) / questions.length) * 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Fin de la session
      handleEndSession();
    }
  };

  const handleEndSession = () => {
    // Supprimer la progression sauvegardée
    clearSavedProgress();
    
    // Navigation vers le rapport
    router.replace({
      pathname: '/training/report',
      params: {
        sessionAnswers: JSON.stringify(sessionAnswers),
        config: JSON.stringify(sessionConfig),
        questions: JSON.stringify(questions),
      },
    });
  };

  const handlePause = () => {
    setIsPaused(true);
    saveProgress(); // Sauvegarder en pausant
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleAbandon = () => {
    Alert.alert(
      'Abandonner la session',
      'Êtes-vous sûr de vouloir abandonner ? Votre progression sera perdue.',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Abandonner', 
          style: 'destructive',
          onPress: () => {
            clearSavedProgress();
            router.back();
          }
        },
      ],
    );
  };

  const getAnswerStyle = (answerId: string) => {
    if (!currentQuestion) return styles.answerDefault;
    
    const answer = currentQuestion.answers.find(a => a.id === answerId);
    const isSelected = selectedAnswers.includes(answerId);

    if (!isValidated) {
      return isSelected ? styles.answerSelected : styles.answerDefault;
    }

    if (answer?.isCorrect) {
      return styles.answerCorrect;
    }

    if (isSelected && !answer?.isCorrect) {
      return styles.answerIncorrect;
    }

    return styles.answerDefault;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Écran de chargement
  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des questions...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Écran d'erreur
  if (error && questions.length === 0) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#EF4444" />
            <Text style={styles.errorTitle}>Erreur</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
              <Text style={styles.errorButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Écran principal de session
  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.progressText}>
              Question {currentQuestionIndex + 1} / {questions.length}
            </Text>
          </View>

          {sessionConfig?.timerEnabled && timeRemaining !== null && (
            <View style={[
              styles.timerContainer,
              timeRemaining <= 10 && styles.timerWarning,
            ]}>
              <Ionicons name="time-outline" size={20} color={theme.colors.white} />
              <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.pauseButton}
            onPress={handlePause}
          >
            <Ionicons name="pause" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Contenu de la question */}
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {currentQuestion && (
            <FadeInView duration={300} key={currentQuestion.id}>
              {/* Informations du thème */}
              <View style={styles.themeInfo}>
                <View style={styles.themeBadge}>
                  <Text style={styles.themeText}>{currentQuestion.theme}</Text>
                </View>
                <View style={styles.subThemeBadge}>
                  <Text style={styles.subThemeText}>{currentQuestion.subTheme}</Text>
                </View>
              </View>

              {/* Question */}
              <View style={styles.questionContainer}>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                {currentQuestion.type === 'multiple' && (
                  <Text style={styles.multipleHint}>
                    ⚠️ Plusieurs réponses possibles
                  </Text>
                )}
              </View>

              {/* Réponses */}
              <View style={styles.answersContainer}>
                {currentQuestion.answers.map((answer) => (
                  <TouchableOpacity
                    key={answer.id}
                    style={getAnswerStyle(answer.id)}
                    onPress={() => toggleAnswer(answer.id)}
                    disabled={isValidated}
                    activeOpacity={0.8}
                  >
                    <View style={styles.answerContent}>
                      <View style={styles.answerIndicator}>
                        {isValidated && answer.isCorrect && (
                          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                        )}
                        {isValidated && selectedAnswers.includes(answer.id) && !answer.isCorrect && (
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        )}
                        {!isValidated && (
                          <View style={[
                            styles.checkbox,
                            selectedAnswers.includes(answer.id) && styles.checkboxSelected,
                          ]}>
                            {selectedAnswers.includes(answer.id) && (
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            )}
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.answerText,
                        isValidated && answer.isCorrect && styles.answerTextCorrect,
                        isValidated && selectedAnswers.includes(answer.id) && !answer.isCorrect && styles.answerTextIncorrect,
                      ]}>
                        {answer.text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Explication (après validation) */}
              {isValidated && currentQuestion.explanation && (
                <FadeInView duration={300} delay={200}>
                  <View style={styles.explanationContainer}>
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text style={styles.explanationText}>
                      {currentQuestion.explanation}
                    </Text>
                  </View>
                </FadeInView>
              )}
            </FadeInView>
          )}
        </ScrollView>

        {/* Boutons d'actions */}
        {currentQuestion && (
          <View style={styles.bottomActions}>
            {!isValidated ? (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={[styles.skipButton, styles.skipButtonContent]}
                  onPress={handleSkip}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.skipButtonText}>Passer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.validateButton,
                    selectedAnswers.length === 0 && styles.validateButtonDisabled,
                  ]}
                  onPress={() => handleValidate()}
                  disabled={selectedAnswers.length === 0}
                >
                  <LinearGradient
                colors={selectedAnswers.length > 0 
                  ? ['#8B5CF6', '#7C3AED'] 
                  : ['#6B7280', '#4B5563']}
                style={styles.validateGradient}
              >
                <Text style={styles.validateText}>VALIDER</Text>
              </LinearGradient>
            </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextQuestion}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.nextGradient}
                >
                  <Text style={styles.nextText}>
                    {currentQuestionIndex < questions.length - 1 
                      ? 'QUESTION SUIVANTE' 
                      : 'TERMINER'}
                  </Text>
                  <Ionicons 
                    name={currentQuestionIndex < questions.length - 1 
                      ? "arrow-forward" 
                      : "checkmark-done"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Modal de pause */}
        <Modal
          visible={isPaused}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.pauseModal}>
              <Text style={styles.pauseTitle}>Session en pause</Text>
              <Text style={styles.pauseStats}>
                Question {currentQuestionIndex + 1} sur {questions.length}
              </Text>
              
              <View style={styles.pauseActions}>
                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={handleResume}
                >
                  <Ionicons name="play" size={24} color="#FFFFFF" />
                  <Text style={styles.resumeText}>Reprendre</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.abandonButton}
                  onPress={handleAbandon}
                >
                  <Ionicons name="close" size={24} color="#EF4444" />
                  <Text style={styles.abandonText}>Abandonner</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  errorButton: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
  },
  errorButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginHorizontal: theme.spacing.md,
  },
  timerWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  timerText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  pauseButton: {
    padding: theme.spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: theme.spacing.lg,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',  // Vert au lieu de rouge
    borderRadius: 3,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  themeInfo: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  themeBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  themeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#A78BFA',
    fontWeight: '600',
  },
  subThemeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  subThemeText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  questionContainer: {
    marginBottom: theme.spacing.xl,
  },
  questionText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    fontWeight: '600',
    lineHeight: 28,
  },
  multipleHint: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  answersContainer: {
    gap: theme.spacing.md,
  },
  answerDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: theme.colors.primary,
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  answerCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  answerIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
    borderWidth: 2,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerIndicator: {
    marginRight: theme.spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  answerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    lineHeight: 22,
  },
  answerTextCorrect: {
    color: '#10B981',
    fontWeight: '600',
  },
  answerTextIncorrect: {
    color: '#EF4444',
  },
  explanationContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  explanationText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  bottomActions: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  skipButton: {
    backgroundColor: '#4B5563',  // Fond gris neutre
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  skipButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  skipButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  validateButton: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.lg,
    flex: 1,
  },
  validateButtonDisabled: {
    opacity: 0.5,
  },
  validateGradient: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  validateText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 1,
  },
  nextButton: {
    overflow: 'hidden',
    borderRadius: theme.borderRadius.lg,
  },
  nextGradient: {
    paddingVertical: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  nextText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseModal: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '85%',
    alignItems: 'center',
  },
  pauseTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  pauseStats: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing.xl,
  },
  pauseActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  resumeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  resumeText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
  },
  abandonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  abandonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: '#EF4444',
  },
});