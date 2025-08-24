import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { theme } from '@/src/styles/theme';

interface Theme {
  id: string;
  name: string;
  icon: string;
  created_at: string;
}

interface SubTheme {
  id: string;
  theme_id: string;
  name: string;
  created_at: string;
}

export default function ThemesScreen(): React.ReactElement {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTheme, setShowAddTheme] = useState(false);
  const [showAddSubTheme, setShowAddSubTheme] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeIcon, setNewThemeIcon] = useState('📚');
  const [newSubThemeName, setNewSubThemeName] = useState('');

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      loadSubThemes(selectedTheme.id);
    }
  }, [selectedTheme]);

  const loadThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');

      if (error) throw error;
      setThemes(data || []);
      if (data && data.length > 0 && !selectedTheme) {
        setSelectedTheme(data[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des thèmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubThemes = async (themeId: string) => {
    try {
      const { data, error } = await supabase
        .from('sub_themes')
        .select('*')
        .eq('theme_id', themeId)
        .order('name');

      if (error) throw error;
      setSubThemes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-thèmes:', error);
    }
  };

  const addTheme = async () => {
    if (!newThemeName.trim()) {
      Alert.alert('Erreur', 'Le nom du thème est requis');
      return;
    }

    try {
      const { error } = await supabase
        .from('themes')
        .insert([{
          name: newThemeName.trim(),
          icon: newThemeIcon || '📚',
        }]);

      if (error) throw error;

      Alert.alert('Succès', 'Thème ajouté avec succès');
      setNewThemeName('');
      setNewThemeIcon('📚');
      setShowAddTheme(false);
      loadThemes();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le thème');
      console.error(error);
    }
  };

  const addSubTheme = async () => {
    if (!newSubThemeName.trim() || !selectedTheme) {
      Alert.alert('Erreur', 'Le nom du sous-thème est requis');
      return;
    }

    try {
      const { error } = await supabase
        .from('sub_themes')
        .insert([{
          name: newSubThemeName.trim(),
          theme_id: selectedTheme.id,
        }]);

      if (error) throw error;

      Alert.alert('Succès', 'Sous-thème ajouté avec succès');
      setNewSubThemeName('');
      setShowAddSubTheme(false);
      loadSubThemes(selectedTheme.id);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le sous-thème');
      console.error(error);
    }
  };

  const deleteTheme = async (theme: Theme) => {
    Alert.alert(
      'Supprimer le thème',
      `Êtes-vous sûr de vouloir supprimer "${theme.name}" et tous ses sous-thèmes ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('themes')
                .delete()
                .eq('id', theme.id);

              if (error) throw error;

              Alert.alert('Succès', 'Thème supprimé');
              if (selectedTheme?.id === theme.id) {
                setSelectedTheme(null);
                setSubThemes([]);
              }
              loadThemes();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le thème');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const deleteSubTheme = async (subTheme: SubTheme) => {
    Alert.alert(
      'Supprimer le sous-thème',
      `Êtes-vous sûr de vouloir supprimer "${subTheme.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('sub_themes')
                .delete()
                .eq('id', subTheme.id);

              if (error) throw error;

              Alert.alert('Succès', 'Sous-thème supprimé');
              loadSubThemes(selectedTheme!.id);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le sous-thème');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Gestion des Thèmes</Text>
          <TouchableOpacity onPress={() => setShowAddTheme(true)} style={styles.addButton}>
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.themesSection}>
            <Text style={styles.sectionTitle}>Thèmes ({themes.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {themes.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeCard,
                    selectedTheme?.id === theme.id && styles.selectedThemeCard,
                  ]}
                  onPress={() => setSelectedTheme(theme)}
                  onLongPress={() => deleteTheme(theme)}
                >
                  <Text style={styles.themeIcon}>{theme.icon}</Text>
                  <Text style={styles.themeName}>{theme.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {selectedTheme && (
            <View style={styles.subThemesSection}>
              <View style={styles.subThemesHeader}>
                <Text style={styles.sectionTitle}>
                  Sous-thèmes de {selectedTheme.name} ({subThemes.length})
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddSubTheme(true)}
                  style={styles.addSubThemeButton}
                >
                  <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              {subThemes.map((subTheme) => (
                <TouchableOpacity
                  key={subTheme.id}
                  style={styles.subThemeItem}
                  onLongPress={() => deleteSubTheme(subTheme)}
                >
                  <Text style={styles.subThemeName}>{subTheme.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              ))}

              {subThemes.length === 0 && (
                <Text style={styles.emptyText}>Aucun sous-thème pour ce thème</Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Modal Ajout Thème */}
        <Modal
          visible={showAddTheme}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddTheme(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouveau Thème</Text>

              <TextInput
                style={styles.input}
                placeholder="Nom du thème"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={newThemeName}
                onChangeText={setNewThemeName}
              />

              <TextInput
                style={styles.input}
                placeholder="Emoji (ex: 📚)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={newThemeIcon}
                onChangeText={setNewThemeIcon}
                maxLength={2}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddTheme(false)}
                >
                  <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={addTheme}
                >
                  <Text style={styles.buttonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Modal Ajout Sous-thème */}
        <Modal
          visible={showAddSubTheme}
          transparent
          animationType="slide"
          onRequestClose={() => setShowAddSubTheme(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouveau Sous-thème</Text>
              <Text style={styles.modalSubtitle}>Pour {selectedTheme?.name}</Text>

              <TextInput
                style={styles.input}
                placeholder="Nom du sous-thème"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={newSubThemeName}
                onChangeText={setNewSubThemeName}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddSubTheme(false)}
                >
                  <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={addSubTheme}
                >
                  <Text style={styles.buttonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  addButton: {
    padding: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.lg,
  },
  themesSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  themeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedThemeCard: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  themeIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  themeName: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
  },
  subThemesSection: {
    flex: 1,
  },
  subThemesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addSubThemeButton: {
    padding: theme.spacing.xs,
  },
  subThemeItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subThemeName: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: theme.spacing.sm,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
  },
});
