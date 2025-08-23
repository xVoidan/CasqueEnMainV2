// Performance optimized
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/common/GradientBackground';
import { Button } from '../../components/common/Button';
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

// Données des thèmes
const INITIAL_THEMES: ITheme[] = [
  {
    id: 'math',
    name: 'Mathématiques',
    icon: '📐',
    color: '#3B82F6',
    selected: false,
    subThemes: [
      { id: 'geometry', name: 'Géométrie', selected: false, questionCount: 50 },
      { id: 'surface', name: 'Calcul de surface', selected: false, questionCount: 40 },
      { id: 'volume', name: 'Volumes', selected: false, questionCount: 35 },
      { id: 'percentage', name: 'Pourcentages', selected: false, questionCount: 30 },
      { id: 'equations', name: 'Équations', selected: false, questionCount: 45 },
    ],
  },
  {
    id: 'french',
    name: 'Français',
    icon: '📚',
    color: '#10B981',
    selected: false,
    subThemes: [
      { id: 'text-study', name: 'Étude de textes', selected: false, questionCount: 60 },
      { id: 'culture', name: 'Culture générale', selected: false, questionCount: 80 },
      { id: 'grammar', name: 'Grammaire', selected: false, questionCount: 40 },
      { id: 'vocabulary', name: 'Vocabulaire', selected: false, questionCount: 50 },
      { id: 'conjugation', name: 'Conjugaison', selected: false, questionCount: 35 },
    ],
  },
  {
    id: 'profession',
    name: 'Métier',
    icon: '🚒',
    color: '#DC2626',
    selected: false,
    subThemes: [
      { id: 'admin-culture', name: 'Culture administrative', selected: false, questionCount: 70 },
      { id: 'operations', name: 'Techniques opérationnelles', selected: false, questionCount: 90 },
      { id: 'prevention', name: 'Prévention', selected: false, questionCount: 40 },
      { id: 'first-aid', name: 'Secours à personne', selected: false, questionCount: 65 },
      { id: 'regulations', name: 'Réglementation', selected: false, questionCount: 55 },
    ],
  },
];

const QUESTION_COUNTS = [10, 20, 30, 40, -1]; // -1 pour illimité

export function TrainingConfigScreen(): React.ReactElement {
  const router = useRouter();
  const [themes, setThemes] = useState<ITheme[]>(INITIAL_THEMES);
  const [questionCount, setQuestionCount] = useState<number>(-1);
  const [timerEnabled, setTimerEnabled] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<string>('30');
  const [scoring, setScoring] = useState<IScoring>({
    correct: 1,
    incorrect: -0.25,
    skipped: 0,
    partial: 0.5,
  });

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
    };

    // Navigation vers la session avec la config
    router.push({
      pathname: '/training/session',
      params: { config: JSON.stringify(sessionConfig) },
    });
  };

  const updateScoring = (field: keyof IScoring, value: string) => {
    const numValue = parseFloat(value) || 0;
    setScoring(prev => ({ ...prev, [field]: numValue }));
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
          <Text style={styles.headerTitle}>Configuration de la session</Text>
          <View style={styles.dynamicStyle1} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sélection des thèmes */}
          <FadeInView duration={600} delay={0}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thèmes d'entraînement</Text>
              <Text style={styles.sectionSubtitle}>
                Sélectionnez les thèmes et sous-thèmes pour votre session
              </Text>

              {themes.map((theme, _index) => (
                <View key={theme.id} style={styles.themeCard}>
                  <TouchableOpacity
                    style={styles.themeHeader}
                    onPress={() => toggleTheme(theme.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.themeLeft}>
                      <Text style={styles.themeIcon}>{theme.icon}</Text>
                      <Text style={styles.themeName}>{theme.name}</Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      theme.selected && styles.checkboxSelected,
                      { borderColor: theme.color },
                    ]}>
                      {theme.selected && (
                        <Ionicons name="checkmark" size={16} color={theme.color} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Sous-thèmes */}
                  <View style={styles.subThemes}>
                    {theme.subThemes.map(subTheme => (
                      <TouchableOpacity
                        key={subTheme.id}
                        style={styles.subThemeItem}
                        onPress={() => toggleSubTheme(theme.id, subTheme.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.subThemeLeft}>
                          <Text style={styles.subThemeName}>{subTheme.name}</Text>
                          <Text style={styles.questionCount}>
                            {subTheme.questionCount} questions
                          </Text>
                        </View>
                        <View style={[
                          styles.checkboxSmall,
                          subTheme.selected && styles.checkboxSelected,
                          { borderColor: theme.color },
                        ]}>
                          {subTheme.selected && (
                            <Ionicons name="checkmark" size={12} color={theme.color} />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {hasSelectedThemes() && (
                <View style={styles.totalQuestions}>
                  <Text style={styles.totalQuestionsText}>
                    Questions disponibles: {getTotalAvailableQuestions()}
                  </Text>
                </View>
              )}
            </View>
          </FadeInView>

          {/* Nombre de questions */}
          <FadeInView duration={600} delay={100}>
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

          {/* Timer */}
          <FadeInView duration={600} delay={200}>
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

          {/* Barème */}
          <FadeInView duration={600} delay={300}>
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

          {/* Bouton de lancement */}
          <FadeInView duration={600} delay={400}>
            <View style={styles.bottomSection}>
              <Button
                title="LANCER LA SESSION"
                onPress={handleStartSession}
                disabled={!hasSelectedThemes()}
                fullWidth
                size="large"
                style={!hasSelectedThemes() && styles.disabledButton}
              />
              {!hasSelectedThemes() && (
                <Text style={styles.warningText}>
                  Veuillez sélectionner au moins un thème
                </Text>
              )}
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
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    marginBottom: theme.spacing.xl,
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
    marginBottom: theme.spacing.md,
  },
  themeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  themeName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkboxSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkboxSmall: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  subThemes: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  subThemeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingLeft: theme.spacing.lg,
  },
  subThemeLeft: {
    flex: 1,
  },
  subThemeName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    marginBottom: 2,
  },
  questionCount: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  totalQuestions: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  totalQuestionsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    fontWeight: '600',
  },
  questionCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
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
  disabledButton: {
    opacity: 0.5,
  },
  warningText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
