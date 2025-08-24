// Performance optimized
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';

// Types pour les thèmes et sous-thèmes
interface ISubTheme {
  id: string;
  name: string;
  selected: boolean;
  questionCount: number;
}

interface ITheme {
  id: string;
  name: string;
  icon: string;
  color: string;
  selected: boolean;
  subThemes: ISubTheme[];
}

interface IScoring {
  correct: number;
  incorrect: number;
  skipped: number;
  partial: number;
}

type QuestionTypeFilter = 'all' | 'single' | 'multiple';

interface SavedPreset {
  id: string;
  name: string;
  icon: string;
  config: any;
  createdAt: string;
}

const PRESETS_STORAGE_KEY = '@training_presets';
const PRESET_EMOJIS = ['🎯', '⚡', '🔥', '💪', '🚀', '⭐', '🏆', '💎', '🎮', '🎨'];

// Données des thèmes synchronisées avec la base de données Supabase (mise à jour: 24/08/2025)
const INITIAL_THEMES: ITheme[] = [
  {
    id: 'mathematiques',
    name: 'Mathématiques',
    icon: '📐',
    color: '#3B82F6',
    selected: false,
    subThemes: [
      { id: 'calcul-mental', name: 'Calcul mental', selected: false, questionCount: 2 },
      { id: 'fractions', name: 'Fractions', selected: false, questionCount: 2 },
      { id: 'geometrie', name: 'Géométrie', selected: false, questionCount: 3 },
      { id: 'pourcentages', name: 'Pourcentages', selected: false, questionCount: 3 },
    ],
  },
  {
    id: 'francais',
    name: 'Français',
    icon: '📚',
    color: '#10B981',
    selected: false,
    subThemes: [
      { id: 'conjugaison', name: 'Conjugaison', selected: false, questionCount: 1 },
      { id: 'culture-generale', name: 'Culture générale', selected: false, questionCount: 1 },
      { id: 'grammaire', name: 'Grammaire', selected: false, questionCount: 2 },
      { id: 'orthographe', name: 'Orthographe', selected: false, questionCount: 2 },
    ],
  },
  {
    id: 'metier',
    name: 'Métier',
    icon: '🚒',
    color: '#DC2626',
    selected: false,
    subThemes: [
      { id: 'culture-administrative', name: 'Culture administrative', selected: false, questionCount: 2 },
      { id: 'diverse', name: 'Diverse', selected: false, questionCount: 5 },
      { id: 'grades-et-hierarchie', name: 'Grades et hiérarchie', selected: false, questionCount: 2 },
      { id: 'hydraulique', name: 'Hydraulique', selected: false, questionCount: 1 },
      { id: 'incendie', name: 'Incendie', selected: false, questionCount: 5 },
      { id: 'materiel-et-equipements', name: 'Matériel et équipements', selected: false, questionCount: 2 },
      { id: 'risques-chimiques', name: 'Risques chimiques', selected: false, questionCount: 1 },
      { id: 'secourisme', name: 'Secourisme', selected: false, questionCount: 5 },
      { id: 'secours-a-personne', name: 'Secours à personne', selected: false, questionCount: 2 },
      { id: 'techniques-operationnelles', name: 'Techniques opérationnelles', selected: false, questionCount: 1 },
    ],
  },
];

const QUESTION_COUNTS = [10, 20, 30, 40, -1]; // -1 pour illimité

export function TrainingConfigScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isQuickMode = params.quickMode === 'true';

  // Paramètres par défaut pour le mode rapide
  const [themes, setThemes] = useState<ITheme[]>(INITIAL_THEMES);
  const [questionCount, setQuestionCount] = useState<number>(isQuickMode ? -1 : -1);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(isQuickMode ? false : false);
  const [timerDuration, setTimerDuration] = useState<string>('30');
  const [scoring, setScoring] = useState<IScoring>({
    correct: 1,
    incorrect: isQuickMode ? -0.5 : -0.25,
    skipped: isQuickMode ? -0.5 : 0,
    partial: 0.5,
  });
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionTypeFilter>(isQuickMode ? 'single' : 'all');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');

  // Sélection/désélection d'un thème principal
  const toggleTheme = (themeId: string) => {
    setThemes(prevThemes =>
      prevThemes.map(theme => {
        if (theme.id === themeId) {
          const newSelected = !theme.selected;
          return {
            ...theme,
            selected: newSelected,
            subThemes: theme.subThemes.map(subTheme => ({
              ...subTheme,
              selected: newSelected,
            })),
          };
        }
        return theme;
      }),
    );
  };

  // Sélection/désélection d'un sous-thème
  const toggleSubTheme = (themeId: string, subThemeId: string) => {
    setThemes(prevThemes =>
      prevThemes.map(theme => {
        if (theme.id === themeId) {
          const updatedSubThemes = theme.subThemes.map(subTheme => {
            if (subTheme.id === subThemeId) {
              return { ...subTheme, selected: !subTheme.selected };
            }
            return subTheme;
          });

          // Vérifier si tous les sous-thèmes sont sélectionnés
          const allSelected = updatedSubThemes.every(st => st.selected);
          const someSelected = updatedSubThemes.some(st => st.selected);

          return {
            ...theme,
            selected: allSelected || someSelected,
            subThemes: updatedSubThemes,
          };
        }
        return theme;
      }),
    );
  };

  // Calculer le nombre total de questions disponibles
  const getTotalAvailableQuestions = (): number => {
    return themes.reduce((total, theme) => {
      return total + theme.subThemes.reduce((subTotal, subTheme) => {
        return subTotal + (subTheme.selected ? subTheme.questionCount : 0);
      }, 0);
    }, 0);
  };

  // Vérifier si au moins un thème est sélectionné
  const hasSelectedThemes = (): boolean => {
    return themes.some(theme => theme.subThemes.some(st => st.selected));
  };

  // Calculer les statistiques de sélection
  const selectionStats = useMemo(() => {
    const selectedThemesCount = themes.filter(t => t.subThemes.some(st => st.selected)).length;
    const selectedSubThemesCount = themes.reduce((acc, t) => acc + t.subThemes.filter(st => st.selected).length, 0);
    const totalSubThemes = themes.reduce((acc, t) => acc + t.subThemes.length, 0);
    return { selectedThemesCount, selectedSubThemesCount, totalSubThemes };
  }, [themes]);

  // Lancer la session
  const handleStartSession = () => {
    if (!hasSelectedThemes()) {
      // TODO: Afficher une alerte
      return;
    }

    const selectedThemes = themes
      .filter(theme => theme.subThemes.some(st => st.selected))
      .map(theme => ({
        ...theme,
        subThemes: theme.subThemes.filter(st => st.selected),
      }));

    const sessionConfig = {
      themes: selectedThemes,
      questionCount,
      timerEnabled,
      timerDuration: timerEnabled ? parseInt(timerDuration, 10) : null,
      scoring,
      questionTypeFilter,
    };

    // Navigation vers la session avec la config
    router.push({
      pathname: '/training/session',
      params: { config: JSON.stringify(sessionConfig) },
    });
  };

  // Lancement rapide avec paramètres par défaut
  const _handleQuickStart = () => {
    if (!hasSelectedThemes()) {
      // TODO: Afficher une alerte
      return;
    }

    const selectedThemes = themes
      .filter(theme => theme.subThemes.some(st => st.selected))
      .map(theme => ({
        ...theme,
        subThemes: theme.subThemes.filter(st => st.selected),
      }));

    const quickSessionConfig = {
      themes: selectedThemes,
      questionCount: -1, // Illimité
      timerEnabled: false, // Pas de timer
      timerDuration: null,
      scoring: {
        correct: 1,
        incorrect: -0.5,
        skipped: -0.5,
        partial: 0.5,
      },
      questionTypeFilter: 'single' as QuestionTypeFilter, // QCU seulement
    };

    // Navigation vers la session avec la config rapide
    router.push({
      pathname: '/training/session',
      params: { config: JSON.stringify(quickSessionConfig) },
    });
  };

  const updateScoring = (field: keyof IScoring, value: string) => {
    const numValue = parseFloat(value) || 0;
    setScoring(prev => ({ ...prev, [field]: numValue }));
  };

  // Fonction pour sauvegarder la configuration actuelle
  const handleSavePreset = async () => {
    if (!presetName.trim() || !hasSelectedThemes()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom et sélectionner des thèmes');
      return;
    }

    const selectedThemes = themes
      .filter(theme => theme.subThemes.some(st => st.selected))
      .map(theme => ({
        ...theme,
        subThemes: theme.subThemes.filter(st => st.selected),
      }));

    const preset: SavedPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      icon: selectedEmoji,
      config: {
        themes: selectedThemes,
        questionCount,
        timerEnabled,
        timerDuration: timerEnabled ? parseInt(timerDuration, 10) : null,
        scoring,
        questionTypeFilter,
      },
      createdAt: new Date().toISOString(),
    };

    try {
      // Récupérer les presets existants
      const existingPresetsJson = await AsyncStorage.getItem(PRESETS_STORAGE_KEY);
      const existingPresets = existingPresetsJson ? JSON.parse(existingPresetsJson) : [];

      // Ajouter le nouveau preset
      const updatedPresets = [...existingPresets, preset];

      // Sauvegarder
      await AsyncStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updatedPresets));

      // Réinitialiser et fermer la modale
      setShowSaveModal(false);
      setPresetName('');
      setSelectedEmoji('🎯');

      Alert.alert('Succès', 'Configuration sauvegardée avec succès !', [
        {
          text: 'OK',
          onPress: () => {
            // Naviguer vers la page précédente avec un paramètre de refresh
            router.replace({
              pathname: '/training/free',
              params: { refresh: Date.now().toString() },
            });
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la configuration');
      console.error('Erreur sauvegarde preset:', error);
    }
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
          <Text style={styles.headerTitle}>
            {isQuickMode ? 'Lancement Rapide' : 'Configuration de la session'}
          </Text>
          {!isQuickMode ? (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => hasSelectedThemes() && setShowSaveModal(true)}
              disabled={!hasSelectedThemes()}
            >
              <Ionicons
                name="save-outline"
                size={24}
                color={hasSelectedThemes() ? theme.colors.white : 'rgba(255, 255, 255, 0.3)'}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode rapide - Message informatif */}
          {isQuickMode && (
            <FadeInView duration={600} delay={0}>
              <View style={styles.quickModeInfo}>
                <Ionicons name="flash" size={20} color="#F59E0B" />
                <View style={styles.quickModeInfoContent}>
                  <Text style={styles.quickModeInfoTitle}>Mode Rapide</Text>
                  <Text style={styles.quickModeInfoText}>
                    QCU uniquement • Sans chronomètre • Questions illimitées • Barème : +1 / -0.5 pts
                  </Text>
                </View>
              </View>
            </FadeInView>
          )}

          {/* Sélection des thèmes */}
          <FadeInView duration={600} delay={isQuickMode ? 100 : 0}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {isQuickMode ? 'Choisissez vos thèmes' : 'Thèmes d\'entraînement'}
              </Text>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionSubtitle}>
                  {selectionStats.selectedSubThemesCount === 0
                    ? '👆 Commencez par sélectionner un thème principal'
                    : `✅ ${selectionStats.selectedSubThemesCount} spécialités sélectionnées`
                  }
                </Text>
                {selectionStats.selectedSubThemesCount > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setThemes(INITIAL_THEMES)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.clearButtonText}>Effacer tout</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Actions rapides */}
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity
                  style={styles.quickActionChip}
                  onPress={() => {
                    // Sélectionner les essentiels
                    setThemes(prevThemes => prevThemes.map(theme => {
                      if (theme.id === 'metier') {
                        return {
                          ...theme,
                          selected: true,
                          subThemes: theme.subThemes.map(st => ({
                            ...st,
                            selected: ['incendie', 'secourisme', 'hydraulique'].includes(st.id),
                          })),
                        };
                      }
                      return { ...theme, selected: false, subThemes: theme.subThemes.map(st => ({ ...st, selected: false })) };
                    }));
                  }}
                >
                  <Ionicons name="flash" size={16} color="#F59E0B" />
                  <Text style={styles.quickActionText}>Essentiels</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionChip}
                  onPress={() => {
                    // Sélectionner tout
                    setThemes(prevThemes => prevThemes.map(theme => ({
                      ...theme,
                      selected: true,
                      subThemes: theme.subThemes.map(st => ({ ...st, selected: true })),
                    })));
                  }}
                >
                  <Ionicons name="checkmark-done" size={16} color="#10B981" />
                  <Text style={styles.quickActionText}>Tout sélectionner</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.themeChipsContainer}>
                {themes.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: theme.selected ? theme.color : 'rgba(255, 255, 255, 0.08)',
                        borderColor: theme.color,
                        transform: theme.selected ? [{ scale: 1.05 }] : [{ scale: 1 }],
                      },
                    ]}
                    onPress={() => toggleTheme(theme.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.themeChipIcon}>{theme.icon}</Text>
                    <Text style={[
                      styles.themeChipText,
                      { color: theme.selected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)' },
                    ]}>
                      {theme.name}
                    </Text>
                    {theme.subThemes.some(st => st.selected) && (
                      <View style={[styles.themeChipBadge, {
                        backgroundColor: theme.subThemes.every(st => st.selected)
                          ? 'rgba(16, 185, 129, 0.3)'
                          : 'rgba(255, 255, 255, 0.3)',
                      }]}>
                        <Text style={styles.themeChipBadgeText}>
                          {theme.subThemes.filter(st => st.selected).length}/{theme.subThemes.length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sous-thèmes en chips */}
              {themes.map((theme) => {
                const hasSelectedSubThemes = theme.subThemes.some(st => st.selected);
                const isThemeActive = theme.selected || hasSelectedSubThemes;

                if (!isThemeActive) return null;

                return (
                  <View key={`${theme.id}-subthemes`} style={styles.subThemesSection}>
                    <View style={styles.subThemesHeader}>
                      <Text style={styles.themeChipIcon}>{theme.icon}</Text>
                      <Text style={styles.subThemesTitle}>{theme.name}</Text>
                      <Text style={styles.subThemesHint}>
                        {theme.subThemes.every(st => st.selected)
                          ? 'Tout sélectionné ✓'
                          : 'Cliquez pour affiner'
                        }
                      </Text>
                      <View style={[styles.subThemesDivider, { backgroundColor: `${theme.color  }20` }]} />
                    </View>
                    <View style={styles.subThemeChipsContainer}>
                      {theme.subThemes.map(subTheme => (
                        <TouchableOpacity
                          key={subTheme.id}
                          style={[
                            styles.subThemeChip,
                            {
                              backgroundColor: subTheme.selected ? `${theme.color  }30` : 'rgba(255, 255, 255, 0.08)',
                              borderColor: subTheme.selected ? theme.color : 'rgba(255, 255, 255, 0.2)',
                            },
                          ]}
                          onPress={() => toggleSubTheme(theme.id, subTheme.id)}
                          activeOpacity={0.7}
                        >
                          {subTheme.selected && (
                            <Ionicons name="checkmark-circle" size={16} color={theme.color} style={{ marginRight: 4 }} />
                          )}
                          <Text style={[
                            styles.subThemeChipText,
                            { color: subTheme.selected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.8)' },
                          ]}>
                            {subTheme.name}
                          </Text>
                          <Text style={[
                            styles.subThemeChipCount,
                            { color: subTheme.selected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)' },
                          ]}>
                            ({subTheme.questionCount})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}

              {hasSelectedThemes() && (
                <View>
                  <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.statNumber}>{selectionStats.selectedSubThemesCount}/{selectionStats.totalSubThemes}</Text>
                      <Text style={styles.statLabel}>Sous-thèmes</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Ionicons name="help-circle" size={20} color="#3B82F6" />
                      <Text style={styles.statNumber}>{getTotalAvailableQuestions()}</Text>
                      <Text style={styles.statLabel}>Questions</Text>
                    </View>
                    <View style={styles.statCard}>
                      <Ionicons name="time" size={20} color="#F59E0B" />
                      <Text style={styles.statNumber}>
                        {questionCount === -1 ? '∞' : questionCount}
                      </Text>
                      <Text style={styles.statLabel}>Limite</Text>
                    </View>
                  </View>
                  <View style={styles.estimatedTime}>
                    <Ionicons name="timer-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                    <Text style={styles.estimatedTimeText}>
                      Durée estimée: {
                        (() => {
                          const totalQuestions = questionCount === -1 ? getTotalAvailableQuestions() : Math.min(questionCount, getTotalAvailableQuestions());
                          if (timerEnabled) {
                            const seconds = totalQuestions * parseInt(timerDuration, 10);
                            return `${Math.ceil(seconds / 60)} min (${timerDuration}s/question)`;
                          } else {
                            return `${Math.ceil(totalQuestions * 0.5)} à ${Math.ceil(totalQuestions * 1.5)} min`;
                          }
                        })()
                      }
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </FadeInView>

          {/* Type de questions - Masqué en mode rapide */}
          {!isQuickMode && (
            <FadeInView duration={600} delay={100}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type de questions</Text>
              <Text style={styles.sectionSubtitle}>
                Choisissez le format des questions pour votre session
              </Text>
              <View style={styles.questionTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.questionTypeButton,
                    questionTypeFilter === 'all' && styles.questionTypeButtonSelected,
                  ]}
                  onPress={() => setQuestionTypeFilter('all')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="apps"
                    size={20}
                    color={questionTypeFilter === 'all' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                  />
                  <Text style={[
                    styles.questionTypeText,
                    questionTypeFilter === 'all' && styles.questionTypeTextSelected,
                  ]}>
                    Tous types
                  </Text>
                  <Text style={[
                    styles.questionTypeDesc,
                    questionTypeFilter === 'all' && styles.questionTypeDescSelected,
                  ]}>
                    QCU + QCM
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.questionTypeButton,
                    questionTypeFilter === 'single' && styles.questionTypeButtonSelected,
                  ]}
                  onPress={() => setQuestionTypeFilter('single')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="radio-button-on"
                    size={20}
                    color={questionTypeFilter === 'single' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                  />
                  <Text style={[
                    styles.questionTypeText,
                    questionTypeFilter === 'single' && styles.questionTypeTextSelected,
                  ]}>
                    Choix unique
                  </Text>
                  <Text style={[
                    styles.questionTypeDesc,
                    questionTypeFilter === 'single' && styles.questionTypeDescSelected,
                  ]}>
                    QCU seulement
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.questionTypeButton,
                    questionTypeFilter === 'multiple' && styles.questionTypeButtonSelected,
                  ]}
                  onPress={() => setQuestionTypeFilter('multiple')}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="checkbox"
                    size={20}
                    color={questionTypeFilter === 'multiple' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                  />
                  <Text style={[
                    styles.questionTypeText,
                    questionTypeFilter === 'multiple' && styles.questionTypeTextSelected,
                  ]}>
                    Choix multiples
                  </Text>
                  <Text style={[
                    styles.questionTypeDesc,
                    questionTypeFilter === 'multiple' && styles.questionTypeDescSelected,
                  ]}>
                    QCM seulement
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </FadeInView>
          )}

          {/* Nombre de questions - Masqué en mode rapide */}
          {!isQuickMode && (
            <FadeInView duration={600} delay={150}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nombre de questions</Text>
              <View style={styles.questionCountRow}>
                {QUESTION_COUNTS.map(count => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.countButton,
                      questionCount === count && styles.countButtonSelected,
                    ]}
                    onPress={() => setQuestionCount(count)}
                  >
                    <Text style={[
                      styles.countButtonText,
                      questionCount === count && styles.countButtonTextSelected,
                    ]}>
                      {count === -1 ? 'Illimité' : count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </FadeInView>
          )}

          {/* Timer - Masqué en mode rapide */}
          {!isQuickMode && (
            <FadeInView duration={600} delay={250}>
            <View style={styles.section}>
              <View style={styles.timerHeader}>
                <Text style={styles.sectionTitle}>Chronomètre</Text>
                <Switch
                  value={timerEnabled}
                  onValueChange={setTimerEnabled}
                  trackColor={{ false: '#767577', true: theme.colors.primary }}
                  thumbColor={timerEnabled ? theme.colors.white : '#f4f3f4'}
                />
              </View>
              {timerEnabled && (
                <View style={styles.timerConfig}>
                  <Text style={styles.timerLabel}>Durée par question (secondes)</Text>
                  <TextInput
                    style={styles.timerInput}
                    value={timerDuration}
                    onChangeText={setTimerDuration}
                    keyboardType="numeric"
                    placeholder="30"
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  />
                </View>
              )}
            </View>
          </FadeInView>
          )}

          {/* Barème - Masqué en mode rapide */}
          {!isQuickMode && (
            <FadeInView duration={600} delay={350}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Barème personnalisé</Text>
              <Text style={styles.sectionSubtitle}>
                Définissez les points pour chaque type de réponse
              </Text>

              <View style={styles.scoringGrid}>
                <View style={styles.scoringItem}>
                  <View style={styles.scoringRow}>
                    <View style={[styles.scoringIndicator, { backgroundColor: '#10B981' }]} />
                    <Text style={styles.scoringLabel}>Bonne réponse</Text>
                  </View>
                  <View style={styles.scoringInputContainer}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('correct', String(Math.max(0, scoring.correct - 0.25)))}
                    >
                      <Ionicons name="remove" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.scoringInput}
                      value={scoring.correct.toString()}
                      onChangeText={(value) => updateScoring('correct', value)}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('correct', String(scoring.correct + 0.25))}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.scoringItem}>
                  <View style={styles.scoringRow}>
                    <View style={[styles.scoringIndicator, { backgroundColor: '#EF4444' }]} />
                    <Text style={styles.scoringLabel}>Mauvaise réponse</Text>
                  </View>
                  <View style={styles.scoringInputContainer}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('incorrect', String(scoring.incorrect - 0.25))}
                    >
                      <Ionicons name="remove" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.scoringInput}
                      value={scoring.incorrect.toString()}
                      onChangeText={(value) => updateScoring('incorrect', value)}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('incorrect', String(scoring.incorrect + 0.25))}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.scoringItem}>
                  <View style={styles.scoringRow}>
                    <View style={[styles.scoringIndicator, { backgroundColor: '#6B7280' }]} />
                    <Text style={styles.scoringLabel}>Absence de réponse</Text>
                  </View>
                  <View style={styles.scoringInputContainer}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('skipped', String(scoring.skipped - 0.25))}
                    >
                      <Ionicons name="remove" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.scoringInput}
                      value={scoring.skipped.toString()}
                      onChangeText={(value) => updateScoring('skipped', value)}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('skipped', String(scoring.skipped + 0.25))}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.scoringItem}>
                  <View style={styles.scoringRow}>
                    <View style={[styles.scoringIndicator, { backgroundColor: '#F59E0B' }]} />
                    <Text style={styles.scoringLabel}>Réponse partielle (QCM)</Text>
                  </View>
                  <View style={styles.scoringInputContainer}>
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('partial', String(Math.max(0, scoring.partial - 0.25)))}
                    >
                      <Ionicons name="remove" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.scoringInput}
                      value={scoring.partial.toString()}
                      onChangeText={(value) => updateScoring('partial', value)}
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                      style={styles.stepperButton}
                      onPress={() => updateScoring('partial', String(scoring.partial + 0.25))}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </FadeInView>
          )}

          {/* Boutons d'action */}
          <FadeInView duration={600} delay={450}>
            <View style={styles.bottomSection}>
              {/* Boutons d'action principaux */}
              <View style={styles.actionButtonsRow}>
                {/* Bouton Lancer la session */}
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.launchButton,
                    isQuickMode && { flex: 1 }, // Prend toute la largeur en mode rapide
                  ]}
                  onPress={handleStartSession}
                  disabled={!hasSelectedThemes()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="play-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {isQuickMode ? 'DÉMARRER' : 'LANCER LA SESSION'}
                  </Text>
                </TouchableOpacity>

                {/* Bouton Sauvegarder - Masqué en mode rapide */}
                {!isQuickMode && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={() => setShowSaveModal(true)}
                    disabled={!hasSelectedThemes()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="bookmark" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>SAUVEGARDER</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Message d'encouragement à sauvegarder - Masqué en mode rapide */}
              {hasSelectedThemes() && !isQuickMode && (
                <View style={styles.saveTip}>
                  <Ionicons name="bulb-outline" size={16} color="rgba(255, 255, 255, 0.6)" />
                  <Text style={styles.saveTipText}>
                    💡 Astuce : Sauvegardez vos paramètres favoris pour les réutiliser rapidement !
                  </Text>
                </View>
              )}

              {!hasSelectedThemes() && (
                <Text style={styles.warningText}>
                  Veuillez sélectionner au moins un thème
                </Text>
              )}
            </View>
          </FadeInView>
        </ScrollView>

        {/* Modale de sauvegarde */}
        <Modal
          visible={showSaveModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSaveModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowSaveModal(false)}
            >
              <TouchableOpacity
                style={styles.modalContent}
                activeOpacity={1}
                onPress={() => {}}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Sauvegarder la configuration</Text>
                  <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.white} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Nom de la configuration</Text>
                <TextInput
                  style={styles.modalInput}
                  value={presetName}
                  onChangeText={setPresetName}
                  placeholder="Ex: Révision rapide, Entraînement intensif..."
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  maxLength={30}
                />

                <Text style={styles.modalLabel}>Choisir une icône</Text>
                <View style={styles.emojiGrid}>
                  {PRESET_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[
                        styles.emojiButton,
                        selectedEmoji === emoji && styles.emojiButtonSelected,
                      ]}
                      onPress={() => setSelectedEmoji(emoji)}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.modalSummary}>
                  <Text style={styles.modalSummaryTitle}>Résumé de la configuration</Text>
                  <Text style={styles.modalSummaryText}>
                    • {selectionStats.selectedSubThemesCount} sous-thèmes sélectionnés
                  </Text>
                  <Text style={styles.modalSummaryText}>
                    • {questionCount === -1 ? 'Questions illimitées' : `${questionCount} questions`}
                  </Text>
                  <Text style={styles.modalSummaryText}>
                    • {timerEnabled ? `Timer: ${timerDuration}s/question` : 'Sans chronomètre'}
                  </Text>
                  <Text style={styles.modalSummaryText}>
                    • Type: {
                      questionTypeFilter === 'all' ? 'Tous types' :
                      questionTypeFilter === 'single' ? 'QCU seulement' : 'QCM seulement'
                    }
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowSaveModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSave]}
                    onPress={handleSavePreset}
                    disabled={!presetName.trim()}
                  >
                    <Text style={[
                      styles.modalButtonText,
                      !presetName.trim() && { opacity: 0.5 },
                    ]}>
                      Sauvegarder
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: '#EF4444',
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  clearButtonText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  themeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 25,
    borderWidth: 2,
  },
  themeChipIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  themeChipText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  themeChipBadge: {
    marginLeft: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  themeChipBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  subThemesSection: {
    marginBottom: theme.spacing.xl,
  },
  subThemesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  subThemesTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  subThemesHint: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: theme.spacing.sm,
  },
  subThemesDivider: {
    flex: 1,
    height: 0.5,
    marginLeft: theme.spacing.md,
    opacity: 0.5,
  },
  subThemeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  subThemeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  subThemeChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  subThemeChipCount: {
    fontSize: theme.typography.fontSize.xs,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.sm,
  },
  estimatedTimeText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statNumber: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.white,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  themeStats: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  questionTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  questionTypeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  questionTypeButtonSelected: {
    backgroundColor: `${theme.colors.primary  }30`,
    borderColor: theme.colors.primary,
  },
  questionTypeText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    marginTop: theme.spacing.xs,
  },
  questionTypeTextSelected: {
    color: theme.colors.white,
  },
  questionTypeDesc: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  questionTypeDescSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  questionCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countButtonSelected: {
    backgroundColor: `${theme.colors.primary  }30`,
    borderColor: theme.colors.primary,
    transform: [{ scale: 1.02 }],
  },
  countButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  countButtonTextSelected: {
    color: theme.colors.white,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  timerConfig: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  timerLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing.sm,
  },
  timerInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    textAlign: 'center',
  },
  scoringGrid: {
    gap: theme.spacing.md,
  },
  scoringItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  scoringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  scoringIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: theme.spacing.sm,
  },
  scoringLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    flex: 1,
  },
  scoringInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoringInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    textAlign: 'center',
    marginHorizontal: theme.spacing.sm,
    minWidth: 80,
  },
  stepperButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.xs,
  },
  bottomSection: {
    marginTop: theme.spacing.lg,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  launchButton: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    flex: 1.5, // Un peu plus large pour le bouton principal
  },
  saveButton: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  saveTipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  quickStartButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#8B5CF6',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  quickStartInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickStartTextContainer: {
    marginLeft: theme.spacing.md,
  },
  quickStartMainText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickStartSubText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  warningText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  saveButtonDuplicate: {
    padding: theme.spacing.sm,
  },
  quickModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  quickModeInfoContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  quickModeInfoTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginBottom: 4,
  },
  quickModeInfoText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  modalLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiButtonSelected: {
    backgroundColor: `${theme.colors.primary  }30`,
    borderColor: theme.colors.primary,
  },
  emojiText: {
    fontSize: 24,
  },
  modalSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalSummaryTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  modalSummaryText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonSave: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
  },
});
