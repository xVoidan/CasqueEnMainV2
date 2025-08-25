import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';

const { width } = Dimensions.get('window');

interface Exam {
  id: string;
  title: string;
  description?: string;
  year: number;
  duration_minutes: number;
  max_questions: number;
  passing_score: number;
  is_practice_mode: boolean;
  completed?: boolean;
  lastScore?: number;
}

export default function ExamSelectionScreenStyled() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Examens d'exemple
  const exams: Exam[] = [
    {
      id: '1',
      title: 'Concours Officiel - Conditions Réelles',
      description: 'Mettez-vous en conditions réelles du concours',
      year: 2025,
      duration_minutes: 60,
      max_questions: 20,
      passing_score: 10,
      is_practice_mode: false,
    },
    {
      id: '2',
      title: 'Examen Blanc - Mode Entraînement',
      description: 'Examen d\'entraînement non comptabilisé dans le classement officiel',
      year: 2025,
      duration_minutes: 60,
      max_questions: 20,
      passing_score: 10,
      is_practice_mode: true,
    },
  ];

  const handleExamSelect = (exam: Exam) => {
    setSelectedExam(exam);
    setShowWarningModal(true);
  };

  const startExam = () => {
    setShowWarningModal(false);
    Alert.alert(
      'Mode Examen',
      'Le mode examen nécessite que la migration de la base de données soit effectuée dans Supabase.',
      [{ text: 'OK' }],
    );
  };

  const startRevisionMode = () => {
    setShowWarningModal(false);
    Alert.alert(
      'Mode Révision',
      'Le mode révision permet de refaire les annales sans contrainte de temps.',
      [{ text: 'OK' }],
    );
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
            colors={[theme.colors.error, '#DC2626']}
            style={styles.modalHeader}
          >
            <Ionicons name="warning" size={48} color={theme.colors.white} />
            <Text style={styles.modalTitle}>⚠️ CONDITIONS D'EXAMEN</Text>
          </LinearGradient>

          <View style={styles.modalBody}>
            <Text style={styles.warningTitle}>Conditions strictes du concours</Text>

            <View style={styles.warningItem}>
              <Ionicons name="time-outline" size={24} color={theme.colors.error} />
              <Text style={styles.warningText}>
                Durée : {selectedExam?.duration_minutes} minutes non-stop
              </Text>
            </View>

            <View style={styles.warningItem}>
              <Ionicons name="pause-circle-outline" size={24} color={theme.colors.error} />
              <Text style={styles.warningText}>
                Impossible de mettre en pause
              </Text>
            </View>

            <View style={styles.warningItem}>
              <Ionicons name="phone-portrait-outline" size={24} color={theme.colors.error} />
              <Text style={styles.warningText}>
                Ne pas quitter l'application
              </Text>
            </View>

            <View style={styles.warningItem}>
              <Ionicons name="calculator-outline" size={24} color={theme.colors.error} />
              <Text style={styles.warningText}>
                Barème : +1 bonne, -0.5 mauvaise/absence
              </Text>
            </View>

            <View style={styles.warningItem}>
              <Ionicons name="podium-outline" size={24} color={theme.colors.error} />
              <Text style={styles.warningText}>
                Seuls les mieux classés réussissent le concours
              </Text>
            </View>

            <Text style={styles.adviceTitle}>Conseils :</Text>
            <Text style={styles.adviceText}>
              • Mode Ne pas déranger activé{'\n'}
              • Environnement calme{'\n'}
              • {selectedExam?.duration_minutes} minutes disponibles
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
                onPress={startRevisionMode}
              >
                <Ionicons name="book-outline" size={20} color={theme.colors.white} />
                <Text style={styles.modalButtonText}>Révision</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.startButton]}
                onPress={startExam}
              >
                <Ionicons name="play-circle" size={20} color={theme.colors.white} />
                <Text style={styles.modalButtonText}>Commencer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const ExamCard = ({ exam }: { exam: Exam }) => {
    const isCompleted = exam.completed;
    const isPractice = exam.is_practice_mode;

    return (
      <FadeInView duration={600} delay={100}>
        <TouchableOpacity
          style={styles.examCard}
          onPress={() => handleExamSelect(exam)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isPractice
              ? [theme.colors.secondary, '#334155']
              : [theme.colors.primary, '#B91C1C']
            }
            style={styles.examGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isPractice && (
              <View style={styles.practiceBadge}>
                <Text style={styles.practiceBadgeText}>BLANC</Text>
              </View>
            )}

            <View style={styles.examHeader}>
              <View style={styles.examTitleContainer}>
                <Text style={styles.examIcon}>🎓</Text>
                <View>
                  <Text style={styles.examTitle}>{exam.title}</Text>
                </View>
              </View>
            </View>

            {exam.description && (
              <Text style={styles.examDescription}>{exam.description}</Text>
            )}

            <View style={styles.examStats}>
              <View style={styles.examStat}>
                <Ionicons name="document-text" size={18} color={theme.colors.white} />
                <Text style={styles.examStatText}>{exam.max_questions}</Text>
                <Text style={styles.examStatLabel}>questions</Text>
              </View>

              <View style={styles.examStatDivider} />

              <View style={styles.examStat}>
                <Ionicons name="time" size={18} color={theme.colors.white} />
                <Text style={styles.examStatText}>{exam.duration_minutes}</Text>
                <Text style={styles.examStatLabel}>minutes</Text>
              </View>

              <View style={styles.examStatDivider} />

              <View style={styles.examStat}>
                <Ionicons name="trophy" size={18} color={theme.colors.white} />
                <Text style={styles.examStatText}>Top</Text>
                <Text style={styles.examStatLabel}>classement</Text>
              </View>
            </View>

            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                <Text style={styles.completedText}>
                  Complété - Score: {exam.lastScore}/20
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mode Examen</Text>
            <Text style={styles.headerSubtitle}>Conditions réelles du concours</Text>
          </View>

          <TouchableOpacity
            style={styles.headerBadge}
            onPress={() => Alert.alert(
              'Mode Examen Sécurisé',
              'Ce mode reproduit les conditions officielles du concours avec détection anti-triche et chronométrage strict.',
              [{ text: 'Compris' }],
            )}
          >
            <Ionicons name="shield-checkmark" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <FadeInView duration={600} delay={0}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Préparez-vous efficacement</Text>
                <Text style={styles.infoText}>
                  Entraînez-vous dans les conditions réelles avec chronométrage et barème officiel
                </Text>
              </View>
            </View>
          </FadeInView>

          <View style={styles.examsList}>
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </View>

          <FadeInView duration={600} delay={200}>
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Fonctionnalités avancées</Text>

              <View style={styles.featureGrid}>
                <View style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.error}20` }]}>
                    <Ionicons name="timer" size={24} color={theme.colors.error} />
                  </View>
                  <Text style={styles.featureTitle}>Timer strict</Text>
                  <Text style={styles.featureDescription}>60 min chrono</Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.success}20` }]}>
                    <Ionicons name="calculator" size={24} color={theme.colors.success} />
                  </View>
                  <Text style={styles.featureTitle}>Barème officiel</Text>
                  <Text style={styles.featureDescription}>+1 / -0.5 points</Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.info}20` }]}>
                    <Ionicons name="shield-checkmark" size={24} color={theme.colors.info} />
                  </View>
                  <Text style={styles.featureTitle}>Anti-triche</Text>
                  <Text style={styles.featureDescription}>Détection sortie</Text>
                </View>

                <View style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: `${theme.colors.warning}20` }]}>
                    <Ionicons name="trophy" size={24} color={theme.colors.warning} />
                  </View>
                  <Text style={styles.featureTitle}>Classement</Text>
                  <Text style={styles.featureDescription}>Top candidats</Text>
                </View>
              </View>
            </View>
          </FadeInView>
        </ScrollView>

        <WarningModal />
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  infoIconContainer: {
    backgroundColor: `${theme.colors.primary}10`,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  examsList: {
    gap: theme.spacing.md,
  },
  examCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  examGradient: {
    padding: theme.spacing.lg,
  },
  practiceBadge: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  practiceBadgeText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: 'bold',
  },
  examHeader: {
    marginBottom: theme.spacing.md,
  },
  examTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  examTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  examYear: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  examDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  examStat: {
    alignItems: 'center',
    flex: 1,
  },
  examStatText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: 4,
  },
  examStatLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  examStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  completedText: {
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
  },
  featuresSection: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255,255,255,0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.sm,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  warningTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  warningText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  adviceTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  adviceText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  cancelButton: {
    backgroundColor: theme.colors.gray[200],
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  revisionButton: {
    backgroundColor: theme.colors.info,
  },
  startButton: {
    backgroundColor: theme.colors.success,
  },
  modalButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    marginLeft: theme.spacing.xs,
  },
});
