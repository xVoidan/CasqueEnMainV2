import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientBackground } from '../../components/common/GradientBackground';
import { sessionServiceV3 as sessionService } from '@/src/services/sessionServiceV3';
import { FadeInView } from '../../components/animations/FadeInView';
import { SessionDeleteConfirmation } from '../../components/notifications/SessionDeleteConfirmation';
import { TrainingLegendModal } from '../../components/training/TrainingLegendModal';
import { DeletePresetModal } from '../../components/modals/DeletePresetModal';
import { theme } from '../../styles/theme';
import { useAuth } from '@/src/store/AuthContext';

interface SavedPreset {
  id: string;
  name: string;
  icon: string;
  config: any;
  createdAt: string;
}

const PRESETS_STORAGE_KEY = '@training_presets';

export function TrainingHomeScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [pausedSession, setPausedSession] = useState<any>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [pendingDeleteSession, setPendingDeleteSession] = useState<any>(null);
  const [showLegendModal, setShowLegendModal] = useState(false);
  const [showDeletePresetModal, setShowDeletePresetModal] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<SavedPreset | null>(null);

  useEffect(() => {
    loadPresets();
    checkPausedSession();
  }, []);

  // Recharger les presets et la session en pause quand on revient
  useEffect(() => {
    if (params.refresh) {
      loadPresets();
      checkPausedSession();
    }
  }, [params.refresh]);
  
  // Recharger la session en pause quand l'écran reprend le focus
  useFocusEffect(
    React.useCallback(() => {
      checkPausedSession();
    }, [user])
  );

  const loadPresets = async () => {
    try {
      const presetsJson = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
      if (presetsJson) {
        setSavedPresets(JSON.parse(presetsJson));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des presets:', error);
    }
  };

  const checkPausedSession = async () => {
    if (!user) return;

    try {
      // Utiliser le nouveau service pour récupérer depuis local + cloud
      const savedProgress = await sessionService.getPausedSession(user.id);
      if (savedProgress) {
        const isSessionIncomplete = savedProgress.currentQuestionIndex < savedProgress.totalQuestions - 1;

        if (isSessionIncomplete) {
          setPausedSession(savedProgress);
          console.log('Session en pause récupérée depuis cloud/local');
        } else {
          setPausedSession(null);
        }
      } else {
        setPausedSession(null);
      }
    } catch (error) {
      console.error('Erreur vérification session en pause:', error);
    }
  };

  const handleResumePausedSession = () => {
    if (pausedSession) {
      router.push({
        pathname: '/training/session',
        params: {
          config: JSON.stringify(pausedSession.config),
          resumeSession: 'true',
        },
      });
    }
  };

  const handleDeletePausedSession = () => {
    if (pausedSession) {
      const correctAnswers = pausedSession.sessionAnswers?.filter((a: any) => a.isCorrect).length || 0;
      setPendingDeleteSession({
        currentQuestion: pausedSession.currentQuestionIndex + 1,
        totalQuestions: pausedSession.totalQuestions,
        totalPoints: pausedSession.totalPoints || 0,
        correctAnswers,
      });
      setShowDeleteConfirmation(true);
    }
  };

  const handleQuickStart = () => {
    // Naviguer vers la configuration avec le mode "quick" activé
    // Les paramètres par défaut seront appliqués dans TrainingConfigScreen
    router.push({
      pathname: '/training/config',
      params: { quickMode: 'true' },
    });
  };

  const handleCustomMode = () => {
    // Navigation vers l'écran de configuration
    router.push('/training/config');
  };

  const handleLoadPreset = (preset: SavedPreset) => {
    // Charger une configuration sauvegardée
    router.push({
      pathname: '/training/session',
      params: { config: JSON.stringify(preset.config) },
    });
  };

  const handleDeletePreset = (preset: SavedPreset) => {
    setPresetToDelete(preset);
    setShowDeletePresetModal(true);
  };

  const confirmDeletePreset = async () => {
    if (!presetToDelete) return;
    
    const updatedPresets = savedPresets.filter(p => p.id !== presetToDelete.id);
    setSavedPresets(updatedPresets);
    await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
    
    setShowDeletePresetModal(false);
    setPresetToDelete(null);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Entraînement Libre</Text>
          <View style={styles.dynamicStyle1} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Session en pause */}
          {pausedSession && (
            <FadeInView duration={400}>
              <View style={styles.pausedSessionCard}>
                <View style={styles.pausedSessionHeader}>
                  <View style={styles.pausedSessionIcon}>
                    <Ionicons name="pause-circle" size={32} color="#F59E0B" />
                  </View>
                  <View style={styles.pausedSessionInfo}>
                    <Text style={styles.pausedSessionTitle}>Session en pause</Text>
                    <Text style={styles.pausedSessionProgress}>
                      Question {pausedSession.currentQuestionIndex + 1}/{pausedSession.totalQuestions}
                    </Text>
                    <Text style={styles.pausedSessionStats}>
                      {pausedSession.totalPoints || 0} points • Série: {pausedSession.streak || 0}
                    </Text>
                  </View>
                </View>
                <View style={styles.pausedSessionActions}>
                  <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={handleResumePausedSession}
                  >
                    <Ionicons name="play" size={20} color="#FFFFFF" />
                    <Text style={styles.resumeButtonText}>Reprendre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteSessionButton}
                    onPress={handleDeletePausedSession}
                  >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </FadeInView>
          )}

          {/* Section principale */}
          <FadeInView duration={600} delay={pausedSession ? 200 : 0}>
            <View style={styles.mainSection}>
              <Text style={styles.welcomeText}>
                {pausedSession ? 'Ou commencez une nouvelle session' : 'Choisissez votre mode d\'entraînement'}
              </Text>

              {/* Bouton Lancement Rapide */}
              <TouchableOpacity
                style={styles.quickStartCard}
                onPress={handleQuickStart}
                activeOpacity={0.9}
              >
                <View style={styles.quickStartGradient}>
                  <View style={styles.quickStartIconContainer}>
                    <Ionicons name="flash" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.quickStartContent}>
                    <Text style={styles.quickStartTitle}>Démarrage Express</Text>
                    <Text style={styles.quickStartDesc}>
                      Lancez-vous immédiatement avec les paramètres optimaux
                    </Text>
                    <View style={styles.quickStartBadges}>
                      <View style={styles.badge}>
                        <Ionicons name="infinite-outline" size={12} color="#FFFFFF" />
                        <Text style={styles.badgeText}>Illimité</Text>
                      </View>
                      <View style={styles.badge}>
                        <Ionicons name="trending-up-outline" size={12} color="#FFFFFF" />
                        <Text style={styles.badgeText}>Adaptatif</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="arrow-forward-circle" size={24} color="#FFFFFF" style={{opacity: 0.9}} />
                </View>
              </TouchableOpacity>

              {/* Bouton Mode Personnalisé */}
              <TouchableOpacity
                style={styles.customModeCard}
                onPress={handleCustomMode}
                activeOpacity={0.9}
              >
                <View style={styles.customModeInner}>
                  <View style={styles.customModeIconContainer}>
                    <Ionicons name="options" size={26} color="#3B82F6" />
                  </View>
                  <View style={styles.customModeContent}>
                    <Text style={styles.customModeTitle}>Configuration Avancée</Text>
                    <Text style={styles.customModeDesc}>
                      Personnalisez chaque aspect de votre entraînement
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle-outline" size={24} color="#3B82F6" />
                </View>
              </TouchableOpacity>

              {/* Bouton Guide/Légende */}
              <TouchableOpacity
                style={styles.helpCard}
                onPress={() => setShowLegendModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.helpCardInner}>
                  <View style={styles.helpIconContainer}>
                    <Ionicons name="information-circle" size={26} color="#F59E0B" />
                  </View>
                  <View style={styles.helpCardContent}>
                    <Text style={styles.helpCardTitle}>Aide & Conseils</Text>
                    <Text style={styles.helpCardDesc}>
                      Maîtrisez tous les secrets de l'application
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward-circle-outline" size={24} color="#F59E0B" />
                </View>
              </TouchableOpacity>
            </View>
          </FadeInView>

          {/* Section des presets sauvegardés */}
          {savedPresets.length > 0 && (
            <FadeInView duration={600} delay={200}>
              <View style={styles.presetsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mes configurations</Text>
                  <Text style={styles.sectionSubtitle}>
                    {savedPresets.length} configuration{savedPresets.length > 1 ? 's' : ''} sauvegardée{savedPresets.length > 1 ? 's' : ''}
                  </Text>
                </View>

                {savedPresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.presetCard}
                    onPress={() => handleLoadPreset(preset)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.presetIcon}>
                      <Text style={styles.presetEmoji}>{preset.icon}</Text>
                    </View>
                    <View style={styles.presetContent}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetDate}>
                        Créé le {new Date(preset.createdAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeletePreset(preset)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </FadeInView>
          )}

          {/* Info section */}
          <FadeInView duration={600} delay={300}>
            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Ionicons name="information-circle" size={20} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.infoText}>
                  Astuce : Sauvegardez vos configurations favorites depuis le mode personnalisé pour y accéder rapidement !
                </Text>
              </View>
            </View>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de légende/guide */}
      <TrainingLegendModal
        visible={showLegendModal}
        onClose={() => setShowLegendModal(false)}
      />

      {/* Modal de confirmation de suppression */}
      <SessionDeleteConfirmation
        visible={showDeleteConfirmation}
        sessionInfo={pendingDeleteSession || {
          currentQuestion: 1,
          totalQuestions: 0,
          totalPoints: 0,
          correctAnswers: 0,
        }}
        onConfirm={async () => {
          if (user) {
            await sessionService.clearPausedSession(user.id);
            setPausedSession(null);
            console.log('Session en pause supprimée');
          }
          setShowDeleteConfirmation(false);
          setPendingDeleteSession(null);
        }}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setPendingDeleteSession(null);
        }}
      />

      {/* Modal de suppression de configuration */}
      <DeletePresetModal
        visible={showDeletePresetModal}
        presetName={presetToDelete?.name || ''}
        presetIcon={presetToDelete?.icon}
        onConfirm={confirmDeletePreset}
        onCancel={() => {
          setShowDeletePresetModal(false);
          setPresetToDelete(null);
        }}
      />
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
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  dynamicStyle1: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  mainSection: {
    marginTop: theme.spacing.lg,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  quickStartCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  quickStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    backgroundColor: '#10B981',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
  },
  quickStartIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStartContent: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  quickStartTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  quickStartDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  quickStartBadges: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  customModeCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
  },
  customModeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  customModeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customModeContent: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  customModeTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 6,
  },
  customModeDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
  helpCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xxl,
    overflow: 'hidden',
  },
  helpCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  helpIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpCardContent: {
    flex: 1,
    marginLeft: theme.spacing.lg,
  },
  helpCardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 6,
  },
  helpCardDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
  presetsSection: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  presetEmoji: {
    fontSize: 20,
  },
  presetContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  presetName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: 2,
  },
  presetDate: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
  infoSection: {
    marginTop: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
  },
  pausedSessionCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  pausedSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  pausedSessionIcon: {
    marginRight: theme.spacing.md,
  },
  pausedSessionInfo: {
    flex: 1,
  },
  pausedSessionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  pausedSessionProgress: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    marginBottom: 2,
  },
  pausedSessionStats: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pausedSessionActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  resumeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    gap: theme.spacing.sm,
  },
  resumeButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deleteSessionButton: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
