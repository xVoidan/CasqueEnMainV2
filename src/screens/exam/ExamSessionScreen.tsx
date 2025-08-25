import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  AppState,
  AppStateStatus,
  Vibration,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { examService } from '@/src/services/examService';
import { Exam, ExamSession, ExamQuestion, ExamProblem } from '@/src/types/exam';
import { theme } from '@/src/styles/theme';
// import * as Notifications from 'expo-notifications'; // Désactivé pour Expo Go

const { width, height } = Dimensions.get('window');

export default function ExamSessionScreen() {
  const { examId, sessionId } = useLocalSearchParams<{ examId: string; sessionId: string }>();
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<string, string>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [hasShownWarning, setHasShownWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout>();
  const appStateRef = useRef(AppState.currentState);
  const backHandlerRef = useRef<any>();

  useEffect(() => {
    loadExamData();
    setupNotifications();
    setupBackHandler();
    setupAppStateListener();

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (exam && !loading) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [exam, loading]);

  const setupNotifications = async () => {
    // Notifications désactivées dans Expo Go SDK 53
    // await Notifications.requestPermissionsAsync();
  };

  const setupBackHandler = () => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        '⚠️ Attention',
        'Êtes-vous sûr de vouloir abandonner l\'examen ? Votre progression sera perdue.',
        [
          { text: 'Continuer l\'examen', style: 'cancel' },
          {
            text: 'Abandonner',
            style: 'destructive',
            onPress: () => abandonExam(),
          },
        ],
      );
      return true;
    });
    backHandlerRef.current = backHandler;
  };

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/active/) &&
      (nextAppState === 'background' || nextAppState === 'inactive')
    ) {
      // L'app passe en arrière-plan
      // showNotification désactivée pour Expo Go
      console.log('⚠️ Examen en cours - Le temps continue de s\'écouler !');
    }
    appStateRef.current = nextAppState;
  };

  const showNotification = async (title: string, body: string) => {
    // Notifications désactivées dans Expo Go SDK 53
    // Utiliser une alerte à la place
    console.log(`Notification: ${title} - ${body}`);
    // await Notifications.scheduleNotificationAsync({
    //   content: {
    //     title,
    //     body,
    //     sound: true,
    //   },
    //   trigger: null,
    // });
  };

  const loadExamData = async () => {
    try {
      setLoading(true);
      const examData = await examService.getExamById(examId);
      if (examData) {
        setExam(examData);
        setTimeRemaining(examData.duration_minutes * 60);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'examen:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'examen');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          handleTimeUp();
          return 0;
        }

        // Alerte 5 minutes avant la fin
        if (prev === 300 && !hasShownWarning) {
          setHasShownWarning(true);
          Vibration.vibrate(1000);
          Alert.alert('⏰ Attention', 'Il ne reste que 5 minutes !');
          // showNotification désactivée pour Expo Go
          console.log('⏰ 5 minutes restantes - Finalisez vos réponses');
        }

        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    Vibration.vibrate([500, 200, 500]);
    Alert.alert(
      '⏰ Temps écoulé',
      'Le temps imparti est terminé. L\'examen va être automatiquement soumis.',
      [{ text: 'OK', onPress: () => submitExam(true) }],
      { cancelable: false },
    );
  };

  const getCurrentProblem = (): ExamProblem | null => {
    if (!exam?.problems) return null;
    return exam.problems.sort((a, b) => a.order_index - b.order_index)[currentProblemIndex];
  };

  const getCurrentQuestion = (): ExamQuestion | null => {
    const problem = getCurrentProblem();
    if (!problem?.questions) return null;
    return problem.questions.sort((a, b) => a.order_index - b.order_index)[currentQuestionIndex];
  };

  const getTotalQuestions = (): number => {
    if (!exam?.problems) return 0;
    return exam.problems.reduce((sum, p) => sum + (p.questions?.length || 0), 0);
  };

  const getCurrentQuestionNumber = (): number => {
    if (!exam?.problems) return 0;
    let questionNumber = 0;
    for (let i = 0; i < currentProblemIndex; i++) {
      questionNumber += exam.problems[i].questions?.length || 0;
    }
    return questionNumber + currentQuestionIndex + 1;
  };

  const handleAnswerSelect = (optionId: string) => {
    const question = getCurrentQuestion();
    if (!question) return;

    const newAnswers = new Map(selectedAnswers);
    newAnswers.set(question.id, optionId);
    setSelectedAnswers(newAnswers);
  };

  const handleNext = async () => {
    const question = getCurrentQuestion();
    const problem = getCurrentProblem();

    if (!question || !problem) return;

    // Enregistrer la réponse
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const selectedOptionId = selectedAnswers.get(question.id) || null;

    try {
      await examService.submitAnswer(
        sessionId,
        question.id,
        selectedOptionId,
        timeSpent,
      );
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la réponse:', error);
    }

    // Passer à la question suivante
    if (currentQuestionIndex < (problem.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentProblemIndex < (exam?.problems?.length || 0) - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Dernière question
      Alert.alert(
        'Fin de l\'examen',
        'Vous avez répondu à toutes les questions. Souhaitez-vous soumettre l\'examen ?',
        [
          { text: 'Revoir', style: 'cancel' },
          { text: 'Soumettre', onPress: () => submitExam(false) },
        ],
      );
    }

    setQuestionStartTime(Date.now());
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentProblemIndex > 0) {
      const prevProblem = exam?.problems?.[currentProblemIndex - 1];
      setCurrentProblemIndex(currentProblemIndex - 1);
      setCurrentQuestionIndex((prevProblem?.questions?.length || 1) - 1);
    }
    setQuestionStartTime(Date.now());
  };

  const submitExam = async (timeout: boolean = false) => {
    setSubmitting(true);

    try {
      // Enregistrer la dernière réponse si non sauvegardée
      const question = getCurrentQuestion();
      if (question && !timeout) {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        const selectedOptionId = selectedAnswers.get(question.id) || null;

        await examService.submitAnswer(
          sessionId,
          question.id,
          selectedOptionId,
          timeSpent,
        );
      }

      // Terminer la session
      const completedSession = await examService.finishExamSession(sessionId);

      // Naviguer vers les résultats
      router.replace({
        pathname: '/exam/results',
        params: {
          sessionId: completedSession.id,
          examId: examId,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      Alert.alert('Erreur', 'Impossible de soumettre l\'examen');
    } finally {
      setSubmitting(false);
    }
  };

  const abandonExam = async () => {
    try {
      await examService.abandonExamSession(sessionId);
      router.back();
    } catch (error) {
      console.error('Erreur lors de l\'abandon:', error);
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (backHandlerRef.current) {
      backHandlerRef.current.remove();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement de l'examen...</Text>
      </View>
    );
  }

  const problem = getCurrentProblem();
  const question = getCurrentQuestion();
  const currentQuestionNum = getCurrentQuestionNumber();
  const totalQuestions = getTotalQuestions();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec timer */}
      <LinearGradient
        colors={timeRemaining < 300 ? ['#FF6B6B', '#FF8E53'] : ['#1e3c72', '#2a5298']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.examTitle}>{exam?.title}</Text>
          <View style={styles.timerContainer}>
            <Ionicons
              name="time"
              size={24}
              color={timeRemaining < 300 ? '#FFE066' : 'white'}
            />
            <Text style={[
              styles.timer,
              timeRemaining < 300 && styles.timerWarning,
            ]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(currentQuestionNum / totalQuestions) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Question {currentQuestionNum}/{totalQuestions}
          </Text>
        </View>
      </LinearGradient>

      {/* Contenu de la question */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {problem && (
          <View style={styles.problemContainer}>
            <View style={styles.problemHeader}>
              <Text style={styles.problemTitle}>
                Problème {currentProblemIndex + 1}: {problem.title}
              </Text>
            </View>

            {problem.context && (
              <View style={styles.contextContainer}>
                <Text style={styles.contextLabel}>Contexte :</Text>
                <Text style={styles.contextText}>{problem.context}</Text>
              </View>
            )}
          </View>
        )}

        {question && (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>
              {currentQuestionIndex + 1}. {question.question_text}
            </Text>

            <View style={styles.optionsContainer}>
              {question.options?.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    selectedAnswers.get(question.id) === option.id && styles.selectedOption,
                  ]}
                  onPress={() => handleAnswerSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.optionRadio,
                    selectedAnswers.get(question.id) === option.id && styles.selectedRadio,
                  ]}>
                    {selectedAnswers.get(question.id) === option.id && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    selectedAnswers.get(question.id) === option.id && styles.selectedOptionText,
                  ]}>
                    {String.fromCharCode(65 + index)}. {option.option_text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionNum === 1 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionNum === 1}
        >
          <Ionicons name="chevron-back" size={24} color="white" />
          <Text style={styles.navButtonText}>Précédent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={() => submitExam(false)}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.submitButtonText}>Terminer</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
        >
          <Text style={styles.navButtonText}>
            {currentQuestionNum === totalQuestions ? 'Revoir' : 'Suivant'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 5,
  },
  timerWarning: {
    color: '#FFE066',
  },
  progressContainer: {
    marginTop: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  problemContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  problemHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
    marginBottom: 10,
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  contextContainer: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 8,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  contextText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#2196F3',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2196F3',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  selectedOptionText: {
    color: '#1976D2',
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    color: 'white',
    fontWeight: '600',
    marginHorizontal: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
