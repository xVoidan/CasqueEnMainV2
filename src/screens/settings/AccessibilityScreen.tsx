import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';

interface AccessibilitySettings {
  colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontSizeMultiplier: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  colorblindMode: 'none',
  fontSize: 'medium',
  fontSizeMultiplier: 1,
  soundEnabled: true,
  vibrationEnabled: true,
  reducedMotion: false,
  highContrast: false,
  screenReaderOptimized: false,
};

export function AccessibilityScreen(): React.ReactElement {
  const router = useRouter();
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [previewText, setPreviewText] = useState('Aperçu du texte avec vos paramètres');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('accessibility_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  const saveSettings = async (newSettings: AccessibilitySettings) => {
    try {
      await AsyncStorage.setItem('accessibility_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      // Appliquer les paramètres globalement (à implémenter dans le contexte global)
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const resetSettings = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  const getFontSizeStyle = () => {
    const baseSize = theme.typography.fontSize.base;
    return {
      fontSize: baseSize * settings.fontSizeMultiplier,
    };
  };

  const getColorblindStyle = () => {
    // Simulation des différents modes de daltonisme
    switch (settings.colorblindMode) {
      case 'protanopia':
        return { color: '#FFB366' }; // Rouge → Orange
      case 'deuteranopia':
        return { color: '#66B3FF' }; // Vert → Bleu
      case 'tritanopia':
        return { color: '#FF66B3' }; // Bleu → Rose
      default:
        return {};
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Accessibilité</Text>
          <TouchableOpacity onPress={resetSettings}>
            <Text style={styles.resetButton}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Aperçu */}
          <FadeInView duration={300}>
            <View style={styles.previewContainer}>
              <Text style={styles.sectionTitle}>Aperçu</Text>
              <View style={[
                styles.previewBox,
                settings.highContrast && styles.highContrastBox
              ]}>
                <Text style={[
                  styles.previewText,
                  getFontSizeStyle(),
                  getColorblindStyle(),
                  settings.highContrast && styles.highContrastText
                ]}>
                  {previewText}
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Mode Daltonien */}
          <FadeInView duration={400} delay={100}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="eye" size={20} color={theme.colors.white} /> Mode Daltonien
              </Text>
              <View style={styles.optionsGrid}>
                {[
                  { value: 'none', label: 'Désactivé', icon: 'close-circle' },
                  { value: 'protanopia', label: 'Protanopie', icon: 'color-filter' },
                  { value: 'deuteranopia', label: 'Deutéranopie', icon: 'color-filter' },
                  { value: 'tritanopia', label: 'Tritanopie', icon: 'color-filter' },
                ].map(mode => (
                  <TouchableOpacity
                    key={mode.value}
                    style={[
                      styles.optionCard,
                      settings.colorblindMode === mode.value && styles.optionCardActive
                    ]}
                    onPress={() => updateSetting('colorblindMode', mode.value as any)}
                  >
                    <Ionicons 
                      name={mode.icon as any} 
                      size={24} 
                      color={settings.colorblindMode === mode.value ? '#8B5CF6' : 'rgba(255,255,255,0.6)'} 
                    />
                    <Text style={[
                      styles.optionText,
                      settings.colorblindMode === mode.value && styles.optionTextActive
                    ]}>
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </FadeInView>

          {/* Taille de Police */}
          <FadeInView duration={500} delay={200}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="text" size={20} color={theme.colors.white} /> Taille de Police
              </Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>A</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0.8}
                  maximumValue={1.5}
                  value={settings.fontSizeMultiplier}
                  onValueChange={(value) => updateSetting('fontSizeMultiplier', value)}
                  minimumTrackTintColor="#8B5CF6"
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor="#8B5CF6"
                />
                <Text style={[styles.sliderLabel, { fontSize: 20 }]}>A</Text>
              </View>
              <Text style={styles.sliderValue}>
                {Math.round(settings.fontSizeMultiplier * 100)}%
              </Text>
            </View>
          </FadeInView>

          {/* Options Visuelles */}
          <FadeInView duration={600} delay={300}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="contrast" size={20} color={theme.colors.white} /> Options Visuelles
              </Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Contraste Élevé</Text>
                  <Text style={styles.switchDescription}>
                    Augmente le contraste pour une meilleure lisibilité
                  </Text>
                </View>
                <Switch
                  value={settings.highContrast}
                  onValueChange={(value) => updateSetting('highContrast', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#8B5CF6' }}
                  thumbColor={settings.highContrast ? '#7C3AED' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Réduire les Animations</Text>
                  <Text style={styles.switchDescription}>
                    Désactive les animations non essentielles
                  </Text>
                </View>
                <Switch
                  value={settings.reducedMotion}
                  onValueChange={(value) => updateSetting('reducedMotion', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#8B5CF6' }}
                  thumbColor={settings.reducedMotion ? '#7C3AED' : '#f4f3f4'}
                />
              </View>
            </View>
          </FadeInView>

          {/* Retour Haptique et Sonore */}
          <FadeInView duration={700} delay={400}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="volume-high" size={20} color={theme.colors.white} /> Retour Sensoriel
              </Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Sons</Text>
                  <Text style={styles.switchDescription}>
                    Retour sonore pour les actions importantes
                  </Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#8B5CF6' }}
                  thumbColor={settings.soundEnabled ? '#7C3AED' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Vibrations</Text>
                  <Text style={styles.switchDescription}>
                    Retour haptique pour les validations
                  </Text>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#8B5CF6' }}
                  thumbColor={settings.vibrationEnabled ? '#7C3AED' : '#f4f3f4'}
                />
              </View>
            </View>
          </FadeInView>

          {/* Lecteur d'Écran */}
          <FadeInView duration={800} delay={500}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="accessibility" size={20} color={theme.colors.white} /> Lecteur d'Écran
              </Text>
              
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Optimisation Lecteur d'Écran</Text>
                  <Text style={styles.switchDescription}>
                    Améliore la navigation pour les lecteurs d'écran
                  </Text>
                </View>
                <Switch
                  value={settings.screenReaderOptimized}
                  onValueChange={(value) => updateSetting('screenReaderOptimized', value)}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#8B5CF6' }}
                  thumbColor={settings.screenReaderOptimized ? '#7C3AED' : '#f4f3f4'}
                />
              </View>
            </View>
          </FadeInView>

          {/* Info Box */}
          <FadeInView duration={900} delay={600}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Ces paramètres sont automatiquement sauvegardés et appliqués à toute l'application.
              </Text>
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
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  resetButton: {
    fontSize: theme.typography.fontSize.sm,
    color: '#EF4444',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  previewContainer: {
    padding: theme.spacing.lg,
  },
  previewBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minHeight: 100,
    justifyContent: 'center',
  },
  highContrastBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  previewText: {
    color: theme.colors.white,
    textAlign: 'center',
    lineHeight: 24,
  },
  highContrastText: {
    fontWeight: 'bold',
  },
  section: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: theme.spacing.xs,
  },
  optionTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
  },
  sliderValue: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: theme.spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  switchLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  switchDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});