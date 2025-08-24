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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
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
const SESSION_STORAGE_KEY = '@training_session_progress';

export function TrainingHomeScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);
  const [pausedSession, setPausedSession] = useState<any>(null);

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
      const savedProgress = await AsyncStorage.getItem(`${SESSION_STORAGE_KEY}_${user.id}`);
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress);

        // Vérifier si c'est une session récente et non terminée
        const hoursSinceLastSave = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
        const isSessionIncomplete = parsed.currentQuestionIndex < (parsed.totalQuestions || 0) - 1;

        if (hoursSinceLastSave < 24 && isSessionIncomplete) {
          setPausedSession(parsed);
        } else {
          // Session trop ancienne ou terminée, la supprimer
          await AsyncStorage.removeItem(`${SESSION_STORAGE_KEY}_${user.id}`);
          setPausedSession(null);
        }
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
    Alert.alert(
      'Supprimer la session',
      'Attention : En supprimant cette session, vous perdrez tous les points et statistiques associés. Êtes-vous sûr ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              await AsyncStorage.removeItem(`${SESSION_STORAGE_KEY}_${user.id}`);
              setPausedSession(null);
            }
          },
        },
      ],
    );
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

  const handleDeletePreset = (presetId: string) => {
    Alert.alert(
      'Supprimer la configuration',
      'Êtes-vous sûr de vouloir supprimer cette configuration ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedPresets = savedPresets.filter(p => p.id !== presetId);
            setSavedPresets(updatedPresets);
            await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));
          },
        },
      ],
    );
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
                  <Ionicons name="rocket" size={32} color="#FFFFFF" />
                  <View style={styles.quickStartContent}>
                    <Text style={styles.quickStartTitle}>LANCEMENT RAPIDE</Text>
                    <Text style={styles.quickStartDesc}>
                      Tous les thèmes • QCU uniquement • Sans chronomètre
                    </Text>
                    <View style={styles.quickStartBadges}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Illimité</Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>+1/-0.5 pts</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* Bouton Mode Personnalisé */}
              <TouchableOpacity
                style={styles.customModeCard}
                onPress={handleCustomMode}
                activeOpacity={0.9}
              >
                <View style={styles.customModeInner}>
                  <Ionicons name="settings" size={28} color={theme.colors.primary} />
                  <View style={styles.customModeContent}>
                    <Text style={styles.customModeTitle}>MODE PERSONNALISÉ</Text>
                    <Text style={styles.customModeDesc}>
                      Configurez vos thèmes, timer et barème
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
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
                      onPress={() => handleDeletePreset(preset.id)}
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
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  quickStartCard: {
    marginBottom: theme.spacing.lg,
  },
  quickStartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  quickStartContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  quickStartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickStartDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing.sm,
  },
  quickStartBadges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  customModeCard: {
    marginBottom: theme.spacing.lg,
  },
  customModeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: `${theme.colors.primary  }40`,
  },
  customModeContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  customModeTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  customModeDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
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
