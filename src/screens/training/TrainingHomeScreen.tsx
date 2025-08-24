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
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);

  useEffect(() => {
    loadPresets();
  }, []);

  // Recharger les presets quand on revient avec le paramètre refresh
  useEffect(() => {
    if (params.refresh) {
      loadPresets();
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
          {/* Section principale */}
          <FadeInView duration={600} delay={0}>
            <View style={styles.mainSection}>
              <Text style={styles.welcomeText}>
                Choisissez votre mode d'entraînement
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
});
