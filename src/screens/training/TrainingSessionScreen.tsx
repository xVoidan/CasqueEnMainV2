// Performance optimized
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/common/GradientBackground';
import { Button } from '../../components/common/Button';
import { theme } from '../../styles/theme';

// Types
interface IQuestion {
  id: string;
  theme: string;
  subTheme: string;
  question: string;
  image?: string;
  answers: IAnswer[];
  type: 'single' | 'multiple';
  explanation?: string;
}

interface IAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
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

interface ISessionAnswer {
  questionId: string;
  selectedAnswers: string[];
  timeSpent: number;
  isCorrect: boolean;
  isPartial?: boolean;
  isSkipped: boolean;
}

// Questions d'exemple (à remplacer par un appel API)
const SAMPLE_QUESTIONS: IQuestion[] = [
  {
    id: '1',
    theme: 'math',
    subTheme: 'geometry',
    question: 'Quelle est la formule pour calculer l\'aire d\'un cercle ?',
    type: 'single',
    answers: [
      { id: 'a', text: 'πr²', isCorrect: true },
      { id: 'b', text: '2πr', isCorrect: false },
      { id: 'c', text: 'πd', isCorrect: false },
      { id: 'd', text: 'r²/π', isCorrect: false },
    ],
    explanation: 'L\'aire d\'un cercle se calcule avec la formule A = πr² où r est le rayon.',
  },
  {
    id: '2',
    theme: 'profession',
    subTheme: 'operations',
    question: 'Quels sont les éléments essentiels d\'une reconnaissance opérationnelle ?',
    type: 'multiple',
    answers: [
      { id: 'a', text: 'Évaluation des risques', isCorrect: true },
      { id: 'b', text: 'Identification des victimes', isCorrect: true },
      { id: 'c', text: 'Mise en place du périmètre', isCorrect: true },
      { id: 'd', text: 'Rédaction du rapport', isCorrect: false },
    ],
    explanation: 'La reconnaissance opérationnelle comprend l\'évaluation des risques, l\'identification des victimes et la mise en place du périmètre de sécurité.',
  },
];

export function TrainingSessionScreen(): React.ReactElement {
  const router = useRouter();
  const { config } = useLocalSearchParams();
  const sessionConfig: ISessionConfig = config ? JSON.parse(config as string) : null;

  const [questions, _setQuestions] = useState<IQuestion[]>(SAMPLE_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [sessionAnswers, setSessionAnswers] = useState<ISessionAnswer[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    sessionConfig?.timerEnabled ? sessionConfig.timerDuration : null,
  );
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    // Animation de la barre de progression
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentQuestionIndex]);

  useEffect(() => {
    // Gestion du timer
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
    if (isValidated) {return;}

    if (currentQuestion.type === 'single') {
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

  const handleValidate = (isTimeout = false) => {
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    // Calculer si la réponse est correcte
    const correctAnswerIds = currentQuestion.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);

    const isCorrect = currentQuestion.type === 'single'
      ? selectedAnswers.length === 1 && correctAnswerIds.includes(selectedAnswers[0])
      : correctAnswerIds.every(id => selectedAnswers.includes(id)) &&
        selectedAnswers.every(id => correctAnswerIds.includes(id));

    const isPartial = currentQuestion.type === 'multiple' &&
      !isCorrect &&
      selectedAnswers.some(id => correctAnswerIds.includes(id)) &&
      !selectedAnswers.some(id => !correctAnswerIds.includes(id));

    // Enregistrer la réponse
    const answer: ISessionAnswer = {
      questionId: currentQuestion.id,
      selectedAnswers: isTimeout ? [] : selectedAnswers,
      timeSpent,
      isCorrect,
      isPartial,
      isSkipped: isTimeout || selectedAnswers.length === 0,
    };

    setSessionAnswers(prev => [...prev, answer]);
    setIsValidated(true);

    // Passer à la question suivante après 1.5s
    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
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
    } else {
      // Fin de la session
      handleEndSession();
    }
  };

  const handleEndSession = () => {
    // Navigation vers le rapport
    router.push({
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
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleAbandon = () => {
    router.back();
  };

  const getAnswerStyle = (answerId: string) => {
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
          >
            <LinearGradient
              colors={['#DC2626', '#EF4444']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Thème et sous-thème */}
          <View style={styles.themeInfo}>
            <Text style={styles.themeName}>
              {currentQuestion.theme === 'math' && '📐 Mathématiques'}
              {currentQuestion.theme === 'french' && '📚 Français'}
              {currentQuestion.theme === 'profession' && '🚒 Métier'}
            </Text>
            <Text style={styles.subThemeName}>{currentQuestion.subTheme}</Text>
          </View>

          {/* Question */}
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {currentQuestion.image && (
              <Image
                source={{ uri: currentQuestion.image }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            )}

            {currentQuestion.type === 'multiple' && (
              <View style={styles.multipleChoiceInfo}>
                <Ionicons name="information-circle" size={16} color="#F59E0B" />
                <Text style={styles.multipleChoiceText}>
                  Plusieurs réponses possibles
                </Text>
              </View>
            )}
          </View>

          {/* Réponses */}
          <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer, index) => (
              <TouchableOpacity
                key={answer.id}
                style={[styles.answerButton, getAnswerStyle(answer.id)]}
                onPress={() => toggleAnswer(answer.id)}
                disabled={isValidated}
                activeOpacity={0.8}
              >
                <View style={styles.answerContent}>
                  <View style={styles.answerLabel}>
                    <Text style={styles.answerLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={styles.answerText}>{answer.text}</Text>
                  {isValidated && (
                    <View style={styles.answerFeedback}>
                      {answer.isCorrect ? (
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      ) : selectedAnswers.includes(answer.id) ? (
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      ) : null}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Explication (après validation) */}
          {isValidated && currentQuestion.explanation && (
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={styles.explanationTitle}>Explication</Text>
              </View>
              <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
            </View>
          )}
        </ScrollView>

        {/* Bouton de validation */}
        {!isValidated && (
          <View style={styles.bottomActions}>
            <Button
              title="VALIDER"
              onPress={() => handleValidate(false)}
              disabled={selectedAnswers.length === 0}
              fullWidth
              size="large"
            />
          </View>
        )}

        {/* Modal de pause */}
        <Modal
          visible={isPaused}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Session en pause</Text>
              <Text style={styles.modalText}>
                Que souhaitez-vous faire ?
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.resumeButton]}
                  onPress={handleResume}
                >
                  <Ionicons name="play" size={20} color={theme.colors.white} />
                  <Text style={styles.modalButtonText}>Reprendre</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.abandonButton]}
                  onPress={handleAbandon}
                >
                  <Ionicons name="close" size={20} color={theme.colors.white} />
                  <Text style={styles.modalButtonText}>Abandonner</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  progressText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.md,
  },
  timerWarning: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  timerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    fontWeight: 'bold',
    marginLeft: theme.spacing.xs,
  },
  pauseButton: {
    padding: theme.spacing.sm,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  themeInfo: {
    marginBottom: theme.spacing.md,
  },
  themeName: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },
  subThemeName: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'capitalize',
  },
  questionCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  questionText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '600',
    lineHeight: 26,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginTop: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  multipleChoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  multipleChoiceText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#92400E',
    marginLeft: theme.spacing.xs,
  },
  answersContainer: {
    gap: theme.spacing.sm,
  },
  answerButton: {
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerDefault: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  answerSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  answerCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  answerIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  answerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  answerLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  answerLetter: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  answerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
  },
  answerFeedback: {
    marginLeft: theme.spacing.sm,
  },
  explanationCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  explanationTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: theme.spacing.xs,
  },
  explanationText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(15, 26, 46, 0.95)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    minWidth: 120,
    justifyContent: 'center',
  },
  resumeButton: {
    backgroundColor: '#10B981',
  },
  abandonButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
});
