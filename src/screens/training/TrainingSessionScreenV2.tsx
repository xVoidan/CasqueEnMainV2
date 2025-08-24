// Performance optimized with Supabase integration
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { SessionPauseNotification } from '../../components/notifications/SessionPauseNotification';
import { theme } from '../../styles/theme';
import { questionService, IQuestion } from '@/src/services/questionService';
import { useAuth } from '@/src/store/AuthContext';
import { soundService } from '@/src/services/soundService';
import { supabase } from '@/src/lib/supabase';

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
  const [isValidated, setIsValidated] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    sessionConfig?.timerEnabled ? sessionConfig.timerDuration : null
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionId] = useState(Date.now().toString());
  const [showPauseNotification, setShowPauseNotification] = useState(false);
  
  // États pour les performances
  const [streak, setStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [questionsToReview, setQuestionsToReview] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pointsAnim = useRef(new Animated.Value(0)).current;

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
        
        // Vérifier si c'est une session récente (moins de 24h) ET non terminée
        const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
        const isSessionIncomplete = parsed.currentQuestionIndex < (parsed.totalQuestions || questions.length) - 1;
        
        if (hoursSinceLastSave < 24 && isSessionIncomplete) {
          Alert.alert(
            'Session en cours',
            `Voulez-vous reprendre votre session précédente ? (Question ${parsed.currentQuestionIndex + 1}/${parsed.totalQuestions || questions.length})`,
            [
              { 
                text: 'Supprimer', 
                onPress: () => {
                  Alert.alert(
                    'Supprimer la session',
                    'Attention : En supprimant cette session, vous perdrez tous les points et statistiques associés. Êtes-vous sûr ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { 
                        text: 'Supprimer', 
                        style: 'destructive',
                        onPress: () => clearSavedProgress()
                      }
                    ]
                  );
                },
                style: 'destructive'
              },
              { 
                text: 'Nouvelle session', 
                onPress: () => clearSavedProgress(),
                style: 'cancel'
              },
              { 
                text: 'Reprendre', 
                onPress: () => {
                  setCurrentQuestionIndex(parsed.currentQuestionIndex);
                  setSessionAnswers(parsed.sessionAnswers || []);
                  setQuestionsToReview(parsed.questionsToReview || []);
                  setTotalPoints(parsed.totalPoints || 0);
                  setStreak(parsed.streak || 0);
                }
              },
            ],
          );
        } else {
          // Session trop ancienne ou terminée, la supprimer
          clearSavedProgress();
        }
      }
    } catch (err) {
      console.error('Erreur restauration progression:', err);
    }
  };

  const saveProgress = async () => {
    if (!user || questions.length === 0) return;
    
    // Ne pas sauvegarder si la session est terminée
    if (currentQuestionIndex >= questions.length - 1 && isValidated) {
      return;
    }
    
    try {
      const progressData = {
        sessionId,
        currentQuestionIndex,
        sessionAnswers,
        questionsToReview,
        totalPoints,
        streak,
        timestamp: Date.now(),
        totalQuestions: questions.length,
        config: sessionConfig,
        questions: questions, // Sauvegarder les questions pour pouvoir reprendre
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
    if (sessionConfig?.timerEnabled && timeRemaining !== null && !isValidated) {
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
  }, [timeRemaining, isValidated, sessionConfig?.timerEnabled]);

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
    
    // Calculer les points et jouer les sons
    let pointsEarned = 0;
    if (isCorrect) {
      pointsEarned = sessionConfig?.scoring?.correct || 1;
      setStreak(prev => prev + 1);
      
      // Jouer le son de bonne réponse (utilise le feedback haptique pour l'instant)
      soundService.playSimpleCorrect();
      
      // Animation de confettis pour 3+ bonnes réponses consécutives
      if (streak >= 2) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        // Jouer le son de streak (utilise le feedback haptique pour l'instant)
        soundService.playSimpleStreak();
      }
      
      // Animation de pulse pour bonne réponse
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isPartial) {
      pointsEarned = sessionConfig?.scoring?.partial || 0.5;
      setStreak(0);
      // Son neutre pour réponse partielle (utilise le feedback haptique pour l'instant)
      soundService.playSimpleSkip();
    } else if (isSkipped) {
      pointsEarned = sessionConfig?.scoring?.skipped || 0;
      setStreak(0);
      // Son de skip (utilise le feedback haptique pour l'instant)
      soundService.playSimpleSkip();
    } else {
      pointsEarned = sessionConfig?.scoring?.incorrect || 0;
      setStreak(0);
      
      // Jouer le son d'erreur (utilise le feedback haptique pour l'instant)
      soundService.playSimpleIncorrect();
      
      // Animation de shake pour mauvaise réponse
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
    
    // Animer les points
    setTotalPoints(prev => {
      const newTotal = prev + pointsEarned;
      Animated.timing(pointsAnim, {
        toValue: newTotal,
        duration: 500,
        useNativeDriver: false,
      }).start();
      return newTotal;
    });

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

  const handleEndSession = async () => {
    // Jouer le son de fin de session (utilise le feedback haptique pour l'instant)
    soundService.playSimpleComplete();
    
    // IMPORTANT: Supprimer immédiatement la progression sauvegardée
    await clearSavedProgress();
    
    // Navigation vers le rapport
    router.replace({
      pathname: '/training/report',
      params: {
        sessionAnswers: JSON.stringify(sessionAnswers),
        config: JSON.stringify(sessionConfig),
        questions: JSON.stringify(questions),
        questionsToReview: JSON.stringify(questionsToReview),
        totalPoints: totalPoints.toString(),
      },
    });
  };

  const handlePause = async () => {
    // Sauvegarder la progression
    await saveProgress();
    
    // Afficher la notification élégante
    setShowPauseNotification(true);
  };
  
  const handleContinueFromPause = () => {
    setShowPauseNotification(false);
  };
  
  const handleQuitFromPause = () => {
    setShowPauseNotification(false);
    router.back();
  };


  const handleAbandon = () => {
    Alert.alert(
      'Abandonner la session',
      'Attention : En abandonnant cette session, vous perdrez tous les points et statistiques associés. Voulez-vous continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Abandonner', 
          style: 'destructive',
          onPress: async () => {
            // Supprimer la progression locale
            await clearSavedProgress();
            
            // Si une session était en cours dans Supabase, la marquer comme abandonnée
            if (sessionId && user) {
              try {
                await supabase
                  .from('sessions')
                  .update({ 
                    status: 'abandoned',
                    ended_at: new Date().toISOString()
                  })
                  .eq('id', sessionId)
                  .eq('user_id', user.id);
              } catch (error) {
                console.error('Erreur mise à jour session abandonnée:', error);
              }
            }
            
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

        {/* Indicateurs de performance */}
        <View style={styles.performanceContainer}>
          <View style={styles.performanceItem}>
            <Ionicons name="flame" size={20} color={streak > 0 ? '#F59E0B' : '#6B7280'} />
            <Text style={[styles.performanceText, streak > 0 && styles.performanceTextActive]}>
              {streak}
            </Text>
          </View>
          <View style={styles.performanceItem}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Animated.Text style={styles.performanceText}>
              {totalPoints.toFixed(1)} pts
            </Animated.Text>
          </View>
          <View style={styles.performanceItem}>
            <Ionicons 
              name="speedometer" 
              size={20} 
              color={
                questionStartTime && (Date.now() - questionStartTime) / 1000 < 10 
                  ? '#10B981' 
                  : (Date.now() - questionStartTime) / 1000 < 20 
                  ? '#F59E0B' 
                  : '#EF4444'
              } 
            />
            <Text style={styles.performanceText}>
              {questionStartTime && `${Math.floor((Date.now() - questionStartTime) / 1000)}s`}
            </Text>
          </View>
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
        
        {/* Mini-carte de progression */}
        <ScrollView 
          horizontal 
          style={styles.miniMapContainer}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.miniMap}>
            {questions.map((_, index) => {
              const answer = sessionAnswers[index];
              return (
                <View
                  key={index}
                  style={[
                    styles.miniMapDot,
                    index === currentQuestionIndex && styles.miniMapDotCurrent,
                    answer?.isCorrect && styles.miniMapDotCorrect,
                    answer && !answer.isCorrect && !answer.isSkipped && styles.miniMapDotIncorrect,
                    answer?.isSkipped && styles.miniMapDotSkipped,
                    questionsToReview.includes(questions[index]?.id) && styles.miniMapDotToReview,
                  ]}
                />
              );
            })}
          </View>
        </ScrollView>

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
              <Animated.View 
                style={[
                  styles.answersContainer,
                  {
                    transform: [
                      { translateX: shakeAnim },
                      { scale: pulseAnim }
                    ]
                  }
                ]}
              >
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
              </Animated.View>

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
              <View style={styles.validatedActionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.reviewButton,
                    questionsToReview.includes(currentQuestion.id) && styles.reviewButtonActive
                  ]}
                  onPress={() => {
                    if (questionsToReview.includes(currentQuestion.id)) {
                      setQuestionsToReview(prev => prev.filter(id => id !== currentQuestion.id));
                    } else {
                      setQuestionsToReview(prev => [...prev, currentQuestion.id]);
                    }
                  }}
                >
                  <Ionicons 
                    name={questionsToReview.includes(currentQuestion.id) ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={questionsToReview.includes(currentQuestion.id) ? "#F59E0B" : "#FFFFFF"} 
                  />
                  <Text style={[
                    styles.reviewButtonText,
                    questionsToReview.includes(currentQuestion.id) && styles.reviewButtonTextActive
                  ]}>
                    {questionsToReview.includes(currentQuestion.id) ? "Marquée" : "À revoir"}
                  </Text>
                </TouchableOpacity>
                
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
                        ? 'SUIVANTE' 
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
              </View>
            )}
          </View>
        )}

      </SafeAreaView>
      
      {/* Notification de pause élégante */}
      <SessionPauseNotification
        visible={showPauseNotification}
        currentQuestion={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        points={totalPoints}
        streak={streak}
        onContinue={handleContinueFromPause}
        onQuit={handleQuitFromPause}
        onClose={handleContinueFromPause}
      />
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
    flex: 1,
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
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  performanceText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
  },
  performanceTextActive: {
    color: '#F59E0B',
  },
  miniMapContainer: {
    maxHeight: 40,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  miniMap: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  miniMapDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  miniMapDotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  miniMapDotCorrect: {
    backgroundColor: '#10B981',
  },
  miniMapDotIncorrect: {
    backgroundColor: '#EF4444',
  },
  miniMapDotSkipped: {
    backgroundColor: '#6B7280',
  },
  miniMapDotToReview: {
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  validatedActionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  reviewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reviewButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
  },
  reviewButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  reviewButtonTextActive: {
    color: '#F59E0B',
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