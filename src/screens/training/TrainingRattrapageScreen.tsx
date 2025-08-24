import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';

interface IQuestion {
  id: string;
  question: string;
  answers: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation?: string;
}

export function TrainingRattrapageScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();

  const questions: IQuestion[] = params.questions
    ? JSON.parse(params.questions as string)
    : [];
  const _config = params.config
    ? JSON.parse(params.config as string)
    : {};

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // Animation pour le swipe
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Gestionnaire de swipe
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        swipeAnim.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 100 && currentQuestionIndex > 0) {
          // Swipe vers la droite - question précédente
          handlePreviousQuestion();
        } else if (gestureState.dx < -100 && currentQuestionIndex < questions.length - 1) {
          // Swipe vers la gauche - question suivante
          handleNextQuestion();
        }
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  const toggleAnswer = (answerId: string) => {
    if (isValidated) return;
    setSelectedAnswers([answerId]);
  };

  const handleValidate = () => {
    if (selectedAnswers.length === 0) return;

    const isCorrect = currentQuestion.answers
      .filter(a => a.isCorrect)
      .some(a => selectedAnswers.includes(a.id));

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    setIsValidated(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswers([]);
      setIsValidated(false);
    } else {
      handleFinish();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswers([]);
      setIsValidated(false);
    }
  };

  const handleFinish = () => {
    router.replace({
      pathname: '/training/rattrapage-report',
      params: {
        totalQuestions: questions.length,
        correctCount,
      },
    });
  };

  if (!currentQuestion) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <Text style={styles.errorText}>Aucune question à réviser</Text>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mode Rattrapage</Text>
          <Text style={styles.progressText}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
        </View>

        {/* Barre de progression */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {/* Navigation par points */}
        <ScrollView
          horizontal
          style={styles.dotsContainer}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.dots}>
            {questions.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setCurrentQuestionIndex(index);
                  setSelectedAnswers([]);
                  setIsValidated(false);
                }}
                style={[
                  styles.dot,
                  index === currentQuestionIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
        </ScrollView>

        {/* Contenu de la question avec swipe */}
        <Animated.View
          style={[
            styles.questionContent,
            {
              transform: [{ translateX: swipeAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

            {/* Réponses */}
            <View style={styles.answersContainer}>
              {currentQuestion.answers.map((answer) => (
                <TouchableOpacity
                  key={answer.id}
                  style={[
                    styles.answerButton,
                    selectedAnswers.includes(answer.id) && styles.answerSelected,
                    isValidated && answer.isCorrect && styles.answerCorrect,
                    isValidated && selectedAnswers.includes(answer.id) && !answer.isCorrect && styles.answerIncorrect,
                  ]}
                  onPress={() => toggleAnswer(answer.id)}
                  disabled={isValidated}
                >
                  <Text style={[
                    styles.answerText,
                    isValidated && answer.isCorrect && styles.answerTextCorrect,
                  ]}>
                    {answer.text}
                  </Text>
                  {isValidated && answer.isCorrect && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                  {isValidated && selectedAnswers.includes(answer.id) && !answer.isCorrect && (
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Explication */}
            {isValidated && currentQuestion.explanation && (
              <FadeInView duration={300}>
                <View style={styles.explanationBox}>
                  <Ionicons name="information-circle" size={20} color="#3B82F6" />
                  <Text style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </Text>
                </View>
              </FadeInView>
            )}
          </ScrollView>
        </Animated.View>

        {/* Boutons d'action */}
        <View style={styles.actionButtons}>
          {currentQuestionIndex > 0 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePreviousQuestion}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          )}

          {!isValidated ? (
            <TouchableOpacity
              style={[
                styles.validateButton,
                selectedAnswers.length === 0 && styles.validateButtonDisabled,
              ]}
              onPress={handleValidate}
              disabled={selectedAnswers.length === 0}
            >
              <LinearGradient
                colors={selectedAnswers.length > 0
                  ? ['#8B5CF6', '#7C3AED']
                  : ['#6B7280', '#4B5563']}
                style={styles.gradientButton}
              >
                <Text style={styles.validateText}>VÉRIFIER</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextQuestion}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.gradientButton}
              >
                <Text style={styles.nextText}>
                  {currentQuestionIndex < questions.length - 1 ? 'SUIVANTE' : 'TERMINER'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {currentQuestionIndex < questions.length - 1 && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextQuestion}
            >
              <Ionicons name="arrow-forward" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Indicateur de swipe */}
        <Text style={styles.swipeHint}>
          ← Glissez pour naviguer →
        </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: theme.spacing.lg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  dotsContainer: {
    maxHeight: 40,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  questionContent: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  questionText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: theme.spacing.xl,
    lineHeight: 28,
  },
  answersContainer: {
    gap: theme.spacing.md,
  },
  answerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  answerSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  answerCorrect: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  answerIncorrect: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  answerText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    marginRight: theme.spacing.md,
  },
  answerTextCorrect: {
    color: '#10B981',
    fontWeight: '600',
  },
  explanationBox: {
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
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  validateButtonDisabled: {
    opacity: 0.5,
  },
  nextButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  validateText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 1,
  },
  nextText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 1,
  },
  swipeHint: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    paddingBottom: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    textAlign: 'center',
    marginTop: 50,
  },
});
