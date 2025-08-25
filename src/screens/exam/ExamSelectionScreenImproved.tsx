import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Exam {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  max_questions: number;
  passing_score: number;
  is_practice_mode: boolean;
  completed?: boolean;
  lastScore?: number;
}

// Composant pour les badges améliorés
const Badge = ({ text, variant = 'default' }: { text: string; variant?: 'default' | 'success' | 'warning' }) => {
  const badgeColors = {
    default: 'rgba(255,255,255,0.2)',
    success: theme.colors.success,
    warning: theme.colors.warning,
  };

  return (
    <View style={[styles.badge, { backgroundColor: badgeColors[variant] }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
};

// Composant pour les statistiques avec meilleure accessibilité
const StatItem = ({ icon, value, label, accessibilityLabel }: {
  icon: string;
  value: string | number;
  label: string;
  accessibilityLabel: string;
}) => (
  <View style={styles.statItem} accessibilityLabel={accessibilityLabel}>
    <Ionicons name={icon as any} size={20} color={theme.colors.white} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function ExamSelectionScreenImproved() {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [modalStep, setModalStep] = useState(0); // Pour un modal en étapes

  // Examens avec titres plus courts et mieux structurés
  const exams: Exam[] = useMemo(() => [
    {
      id: '1',
      title: 'Concours Officiel',
      description: 'Conditions réelles du concours SPP',
      duration_minutes: 60,
      max_questions: 20,
      passing_score: 10,
      is_practice_mode: false,
    },
    {
      id: '2',
      title: 'Mode Entraînement',
      description: 'Préparez-vous sans pression',
      duration_minutes: 60,
      max_questions: 20,
      passing_score: 10,
      is_practice_mode: true,
    },
  ], []);

  const handleExamSelect = useCallback((exam: Exam) => {
    setSelectedExam(exam);
    setModalStep(0);
    setShowWarningModal(true);

    // Annonce pour l'accessibilité
    AccessibilityInfo.announceForAccessibility(
      `Sélection de ${exam.title}. Veuillez confirmer pour commencer.`,
    );
  }, []);

  const startExam = useCallback(() => {
    setShowWarningModal(false);
    Alert.alert(
      'Démarrage du Mode Examen',
      `${selectedExam?.title} va commencer. Êtes-vous prêt ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Commencer',
          onPress: () => {
            // Navigation vers l'écran d'examen
            console.log('Starting exam:', selectedExam?.id);
          },
        },
      ],
    );
  }, [selectedExam]);

  const startRevisionMode = useCallback(() => {
    setShowWarningModal(false);
    Alert.alert(
      'Mode Révision Activé',
      'Vous pouvez maintenant réviser sans contrainte de temps.',
      [{ text: 'OK' }],
    );
  }, []);

  // Modal amélioré avec navigation par étapes
  const ImprovedWarningModal = () => {
    const modalSteps = [
      {
        title: 'Conditions d\'examen',
        icon: 'warning',
        content: (
          <View style={styles.modalStepContent}>
            <Text style={styles.modalStepTitle}>Êtes-vous prêt ?</Text>
            <Text style={styles.modalStepDescription}>
              L'examen dure {selectedExam?.duration_minutes} minutes sans pause possible.
            </Text>

            <View style={styles.modalFeatures}>
              <View style={styles.modalFeatureItem}>
                <Ionicons name="time-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.modalFeatureText}>Chronométrage strict</Text>
              </View>
              <View style={styles.modalFeatureItem}>
                <Ionicons name="calculator-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.modalFeatureText}>Barème +1 / -0.5</Text>
              </View>
            </View>
          </View>
        ),
      },
      {
        title: 'Conseils importants',
        icon: 'bulb',
        content: (
          <View style={styles.modalStepContent}>
            <Text style={styles.modalStepTitle}>Avant de commencer</Text>

            <View style={styles.modalChecklist}>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.checklistText}>Activez le mode Ne pas déranger</Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.checklistText}>Trouvez un endroit calme</Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.checklistText}>Gardez votre téléphone chargé</Text>
              </View>
            </View>
          </View>
        ),
      },
    ];

    const currentStep = modalSteps[modalStep];

    return (
      <Modal
        visible={showWarningModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWarningModal(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={[theme.colors.primary, '#B91C1C']}
              style={styles.modalHeader}
            >
              <Ionicons
                name={currentStep.icon as any}
                size={32}
                color={theme.colors.white}
              />
              <Text style={styles.modalTitle}>{currentStep.title}</Text>

              {/* Indicateur de progression */}
              <View style={styles.modalProgress}>
                {modalSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.modalProgressDot,
                      index === modalStep && styles.modalProgressDotActive,
                    ]}
                  />
                ))}
              </View>
            </LinearGradient>

            <View style={styles.modalBody}>
              {currentStep.content}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowWarningModal(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Annuler"
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>

                {modalStep < modalSteps.length - 1 ? (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.nextButton]}
                    onPress={() => setModalStep(modalStep + 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Suivant"
                  >
                    <Text style={styles.modalButtonText}>Suivant</Text>
                    <Ionicons name="arrow-forward" size={20} color={theme.colors.white} />
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.revisionButton]}
                      onPress={startRevisionMode}
                      accessibilityRole="button"
                      accessibilityLabel="Mode révision"
                    >
                      <Ionicons name="book-outline" size={20} color={theme.colors.white} />
                      <Text style={styles.modalButtonText}>Révision</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.startButton]}
                      onPress={startExam}
                      accessibilityRole="button"
                      accessibilityLabel="Commencer l'examen"
                    >
                      <Ionicons name="play-circle" size={20} color={theme.colors.white} />
                      <Text style={styles.modalButtonText}>Commencer</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Carte d'examen améliorée
  const ExamCard = ({ exam }: { exam: Exam }) => {
    const isPractice = exam.is_practice_mode;
    const cardColors = isPractice
      ? [theme.colors.secondary, '#334155']
      : [theme.colors.primary, '#B91C1C'];

    return (
      <FadeInView duration={600} delay={100}>
        <TouchableOpacity
          style={styles.examCard}
          onPress={() => handleExamSelect(exam)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`${exam.title}, ${exam.description}, ${exam.duration_minutes} minutes, ${exam.max_questions} questions`}
          accessibilityHint="Appuyez deux fois pour sélectionner cet examen"
        >
          <LinearGradient
            colors={cardColors}
            style={styles.examGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Badge pour le mode */}
            <View style={styles.examBadgeContainer}>
              {isPractice ? (
                <Badge text="ENTRAÎNEMENT" variant="default" />
              ) : (
                <Badge text="OFFICIEL" variant="warning" />
              )}
            </View>

            {/* Header avec titre et icône */}
            <View style={styles.examHeader}>
              <Ionicons
                name={isPractice ? 'school-outline' : 'trophy-outline'}
                size={32}
                color={theme.colors.white}
              />
              <View style={styles.examTitleContainer}>
                <Text
                  style={styles.examTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {exam.title}
                </Text>
                <Text
                  style={styles.examDescription}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {exam.description}
                </Text>
              </View>
            </View>

            {/* Statistiques */}
            <View style={styles.examStats}>
              <StatItem
                icon="document-text"
                value={exam.max_questions}
                label="questions"
                accessibilityLabel={`${exam.max_questions} questions`}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon="time"
                value={exam.duration_minutes}
                label="minutes"
                accessibilityLabel={`${exam.duration_minutes} minutes`}
              />
              <View style={styles.statDivider} />
              <StatItem
                icon="trophy"
                value="Top"
                label="classement"
                accessibilityLabel="Classement compétitif"
              />
            </View>

            {/* Status si complété */}
            {exam.completed && (
              <View style={styles.completedSection}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.completedText}>
                  Dernier score: {exam.lastScore}/20
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
        {/* Header amélioré */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mode Examen</Text>
            <Text style={styles.headerSubtitle}>Sélectionnez votre mode</Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => Alert.alert(
              'Aide',
              'Choisissez entre le mode officiel (avec classement) ou le mode entraînement (sans pression).',
              [{ text: 'Compris' }],
            )}
            accessibilityRole="button"
            accessibilityLabel="Aide"
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Contenu principal */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Info card simplifiée */}
          <FadeInView duration={600}>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                Choisissez votre mode d'examen ci-dessous
              </Text>
            </View>
          </FadeInView>

          {/* Liste des examens */}
          <View style={styles.examsList}>
            {exams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </View>

          {/* Section des fonctionnalités responsive */}
          <FadeInView duration={600} delay={200}>
            <Text style={styles.featuresTitle}>Fonctionnalités</Text>
            <View style={styles.featuresGrid}>
              {[
                { icon: 'timer', title: 'Chrono', desc: '60 min', color: theme.colors.error },
                { icon: 'calculator', title: 'Barème', desc: '+1/-0.5', color: theme.colors.success },
                { icon: 'shield-checkmark', title: 'Sécurisé', desc: 'Anti-triche', color: theme.colors.info },
                { icon: 'trophy', title: 'Classement', desc: 'National', color: theme.colors.warning },
              ].map((feature, index) => (
                <View
                  key={index}
                  style={styles.featureCard}
                  accessibilityLabel={`${feature.title}: ${feature.desc}`}
                >
                  <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                    <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                  </View>
                  <Text style={styles.featureTitle} numberOfLines={1}>{feature.title}</Text>
                  <Text style={styles.featureDesc} numberOfLines={1}>{feature.desc}</Text>
                </View>
              ))}
            </View>
          </FadeInView>
        </ScrollView>

        {/* Modal amélioré */}
        <ImprovedWarningModal />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  helpButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  // Exam Cards
  examsList: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  examCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  examGradient: {
    padding: theme.spacing.lg,
  },
  examBadgeContainer: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
  examHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  examTitleContainer: {
    flex: 1,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  examDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  completedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    gap: theme.spacing.sm,
  },
  completedText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },

  // Features Grid
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    margin: theme.spacing.xs,
    flex: 1,
    minWidth: Math.min(150, (screenWidth - theme.spacing.lg * 2 - theme.spacing.xs * 4) / 2),
    maxWidth: 200,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  // Badge Component
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    maxHeight: screenHeight * 0.7,
  },
  modalHeader: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.sm,
  },
  modalProgress: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  modalProgressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  modalProgressDotActive: {
    backgroundColor: theme.colors.white,
  },
  modalBody: {
    padding: theme.spacing.lg,
  },
  modalStepContent: {
    marginBottom: theme.spacing.lg,
  },
  modalStepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  modalStepDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  modalFeatures: {
    gap: theme.spacing.md,
  },
  modalFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  modalFeatureText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  modalChecklist: {
    marginTop: theme.spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  checklistText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  cancelButton: {
    backgroundColor: theme.colors.gray[200],
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    flex: 2,
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
    fontSize: 14,
  },
});
