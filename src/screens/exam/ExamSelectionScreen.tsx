import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { examService } from '@/src/services/examService';
import { Exam } from '@/src/types/exam';
import { useAuth } from '@/src/hooks/useAuth';
import { theme } from '@/src/styles/theme';

const { width } = Dimensions.get('window');

export default function ExamSelectionScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [globalRank, setGlobalRank] = useState<{rank: number, total: number} | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadExams();
    loadGlobalRanking();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const availableExams = await examService.getAvailableExams();
      setExams(availableExams);
    } catch (error) {
      console.error('Erreur lors du chargement des examens:', error);
      Alert.alert('Erreur', 'Impossible de charger les examens disponibles');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalRanking = async () => {
    if (!user?.id) return;
    try {
      const ranking = await examService.getGlobalRanking(user.id);
      setGlobalRank(ranking);
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error);
    }
  };

  const handleExamSelect = (exam: Exam) => {
    setSelectedExam(exam);
    setShowWarningModal(true);
  };

  const startExam = async () => {
    if (!selectedExam || !user?.id) return;

    try {
      const session = await examService.startExamSession(selectedExam.id, user.id);
      router.push({
        pathname: '/exam/session',
        params: {
          examId: selectedExam.id,
          sessionId: session.id,
        },
      });
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de démarrer l\'examen');
    }
  };

  const startRevisionMode = async () => {
    if (!selectedExam || !user?.id) return;

    try {
      const session = await examService.startRevisionMode(selectedExam.id, user.id);
      router.push({
        pathname: '/exam/revision',
        params: {
          examId: selectedExam.id,
          sessionId: session.id,
        },
      });
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de démarrer la révision');
    }
  };

  const WarningModal = () => (
    <Modal
      visible={showWarningModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowWarningModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.modalHeader}
          >
            <Ionicons name="warning" size={48} color="white" />
            <Text style={styles.modalTitle}>⚠️ IMPORTANT</Text>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.warningTitle}>Conditions d'examen strictes</Text>

            <View style={styles.warningItem}>
              <Ionicons name="time-outline" size={24} color="#FF6B6B" />
              <Text style={styles.warningText}>
                Durée : {selectedExam?.duration_minutes} minutes non-stop
              </Text>
            </View>

            <View style={styles.warningItem}>
              <Ionicons name="pause-circle-outline" size={24} color="#FF6B6B" />
              <Text style={styles.warningText}>
                Impossible de mettre en pause
              </Text>
            </View>

            <View style={styles.warningItem}>
              <Ionicons name="phone-portrait-outline" size={24} color="#FF6B6B" />
              <Text style={styles.warningText}>
                Ne pas quitter l'application (détection anti-triche)
              </Text>
            </View>

            <View style={styles.warningItem}>
              <Ionicons name="calculator-outline" size={24} color="#FF6B6B" />
              <Text style={styles.warningText}>
                Barème : +1 bonne réponse, -0.5 mauvaise/absence
              </Text>
            </View>

            <Text style={styles.adviceTitle}>Conseils :</Text>
            <Text style={styles.adviceText}>
              • Mettez votre téléphone en mode Ne pas déranger{'\n'}
              • Installez-vous dans un endroit calme{'\n'}
              • Préparez papier et crayon si nécessaire{'\n'}
              • Assurez-vous d'avoir {selectedExam?.duration_minutes} minutes devant vous
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWarningModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.revisionButton]}
                onPress={() => {
                  setShowWarningModal(false);
                  startRevisionMode();
                }}
              >
                <Ionicons name="book-outline" size={20} color="white" />
                <Text style={styles.modalButtonText}>Mode Révision</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.startButton]}
                onPress={() => {
                  setShowWarningModal(false);
                  startExam();
                }}
              >
                <Ionicons name="play-circle" size={20} color="white" />
                <Text style={styles.modalButtonText}>Commencer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ExamCard = ({ exam }: { exam: Exam }) => {
    const totalQuestions = exam.problems?.reduce(
      (sum, p) => sum + (p.questions?.length || 0),
      0,
    ) || 0;

    return (
      <TouchableOpacity
        style={styles.examCard}
        onPress={() => handleExamSelect(exam)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={exam.is_practice_mode ? ['#667eea', '#764ba2'] : ['#4CAF50', '#45a049']}
          style={styles.examGradient}
        >
          {exam.is_practice_mode && (
            <View style={styles.practiceBadge}>
              <Text style={styles.practiceBadgeText}>BLANC</Text>
            </View>
          )}

          <View style={styles.examHeader}>
            <Text style={styles.examTitle}>{exam.title}</Text>
            <Text style={styles.examYear}>{exam.year}</Text>
          </View>

          {exam.description && (
            <Text style={styles.examDescription}>{exam.description}</Text>
          )}

          <View style={styles.examStats}>
            <View style={styles.examStat}>
              <Ionicons name="document-text" size={20} color="white" />
              <Text style={styles.examStatText}>{totalQuestions} questions</Text>
            </View>
            <View style={styles.examStat}>
              <Ionicons name="time" size={20} color="white" />
              <Text style={styles.examStatText}>{exam.duration_minutes} min</Text>
            </View>
            <View style={styles.examStat}>
              <Ionicons name="trophy" size={20} color="white" />
              <Text style={styles.examStatText}>≥ {exam.passing_score}/20</Text>
            </View>
          </View>

          {exam.user_session && (
            <View style={styles.previousAttempt}>
              <Ionicons name="checkmark-circle" size={16} color="#90EE90" />
              <Text style={styles.previousAttemptText}>
                Déjà passé - Score: {exam.user_session.score}/20
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement des examens...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mode Examen</Text>
          <Text style={styles.headerSubtitle}>Conditions réelles du concours</Text>
        </View>

        {globalRank && (
          <View style={styles.globalRankBadge}>
            <Ionicons name="earth" size={16} color="white" />
            <Text style={styles.globalRankText}>
              {globalRank.rank}/{globalRank.total}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Choisissez une annale pour vous entraîner dans les conditions réelles du concours.
            Vous pouvez aussi opter pour le mode révision sans contrainte de temps.
          </Text>
        </View>

        {exams.length > 0 ? (
          <View style={styles.examsList}>
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              Aucun examen disponible pour le moment
            </Text>
          </View>
        )}
      </ScrollView>

      <WarningModal />
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
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  globalRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  globalRankText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  examsList: {
    gap: 15,
  },
  examCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 15,
  },
  examGradient: {
    padding: 20,
  },
  practiceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  practiceBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  examYear: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  examDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
    lineHeight: 20,
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  examStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examStatText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  previousAttempt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  previousAttemptText: {
    color: '#90EE90',
    marginLeft: 5,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  modalBody: {
    padding: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#555',
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  adviceText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  revisionButton: {
    backgroundColor: '#9C27B0',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});
