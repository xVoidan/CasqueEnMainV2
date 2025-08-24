import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from '@/src/lib/supabase';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { theme } from '@/src/styles/theme';

export default function ImportExportScreen(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [exportStats, setExportStats] = useState<any>(null);
  const [importStats, setImportStats] = useState<any>(null);

  const exportData = async () => {
    setLoading(true);
    try {
      const [themes, subThemes, questions] = await Promise.all([
        supabase.from('themes').select('*'),
        supabase.from('sub_themes').select('*'),
        supabase.from('questions').select('*'),
      ]);

      const data = {
        themes: themes.data || [],
        sub_themes: subThemes.data || [],
        questions: questions.data || [],
        exported_at: new Date().toISOString(),
      };

      const jsonData = JSON.stringify(data, null, 2);
      const fileName = `casque-en-mains-export-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, jsonData);

      setExportStats({
        themes: data.themes.length,
        subThemes: data.sub_themes.length,
        questions: data.questions.length,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Succès', `Export sauvegardé : ${fileName}`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const importData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) return;

      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const data = JSON.parse(fileContent);

      if (!data.themes || !data.sub_themes || !data.questions) {
        Alert.alert('Erreur', 'Format de fichier invalide');
        return;
      }

      Alert.alert(
        'Confirmer l\'import',
        `Voulez-vous importer :\n- ${data.themes.length} thème(s)\n- ${data.sub_themes.length} sous-thème(s)\n- ${data.questions.length} question(s) ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Importer',
            onPress: async () => {
              setLoading(true);
              try {
                let themesImported = 0;
                let subThemesImported = 0;
                let questionsImported = 0;

                // Import des thèmes
                for (const theme of data.themes) {
                  const { id: _id, created_at: _created_at, ...themeData } = theme;
                  const { error } = await supabase
                    .from('themes')
                    .upsert(themeData, { onConflict: 'name' });

                  if (!error) themesImported++;
                }

                // Import des sous-thèmes
                for (const subTheme of data.sub_themes) {
                  const { id: _id, created_at: _created_at, ...subThemeData } = subTheme;
                  const { error } = await supabase
                    .from('sub_themes')
                    .upsert(subThemeData, { onConflict: 'name,theme_id' });

                  if (!error) subThemesImported++;
                }

                // Import des questions
                for (const question of data.questions) {
                  const { id: _id, created_at: _created_at, ...questionData } = question;
                  const { error } = await supabase
                    .from('questions')
                    .insert(questionData);

                  if (!error) questionsImported++;
                }

                setImportStats({
                  themes: themesImported,
                  subThemes: subThemesImported,
                  questions: questionsImported,
                });

                Alert.alert('Succès', 'Import terminé avec succès');
              } catch (error) {
                Alert.alert('Erreur', 'Erreur lors de l\'import');
                console.error(error);
              } finally {
                setLoading(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de lire le fichier');
      console.error(error);
    }
  };

  const exportCSVTemplate = async () => {
    const csvContent = `theme_name,theme_icon,sub_theme_name,question,correct_answer,wrong_answer_1,wrong_answer_2,wrong_answer_3,explanation
"Sécurité Routière","🚗","Code de la route","Quelle est la vitesse maximale en ville ?","50 km/h","30 km/h","70 km/h","90 km/h","La vitesse est limitée à 50 km/h en agglomération sauf indication contraire"
"Sécurité Routière","🚗","Signalisation","Que signifie un panneau triangulaire rouge ?","Danger","Interdiction","Obligation","Information","Les panneaux triangulaires signalent un danger"`;

    const fileName = 'template-questions.csv';
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Succès', `Template sauvegardé : ${fileName}`);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Import/Export</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Export Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📥 Export des Données</Text>
            <Text style={styles.description}>
              Exportez toutes vos données (thèmes, sous-thèmes et questions) au format JSON.
            </Text>

            <TouchableOpacity onPress={exportData} disabled={loading}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.actionButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={24} color={theme.colors.white} />
                    <Text style={styles.buttonText}>Exporter en JSON</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {exportStats && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Dernier Export</Text>
                <Text style={styles.statsText}>• {exportStats.themes} thème(s)</Text>
                <Text style={styles.statsText}>• {exportStats.subThemes} sous-thème(s)</Text>
                <Text style={styles.statsText}>• {exportStats.questions} question(s)</Text>
              </View>
            )}
          </View>

          {/* Import Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📤 Import des Données</Text>
            <Text style={styles.description}>
              Importez des données depuis un fichier JSON exporté précédemment.
            </Text>

            <TouchableOpacity onPress={importData} disabled={loading}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.actionButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="upload-outline" size={24} color={theme.colors.white} />
                <Text style={styles.buttonText}>Importer JSON</Text>
              </LinearGradient>
            </TouchableOpacity>

            {importStats && (
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Dernier Import</Text>
                <Text style={styles.statsText}>• {importStats.themes} thème(s) importé(s)</Text>
                <Text style={styles.statsText}>• {importStats.subThemes} sous-thème(s) importé(s)</Text>
                <Text style={styles.statsText}>• {importStats.questions} question(s) importée(s)</Text>
              </View>
            )}
          </View>

          {/* CSV Template Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Modèle CSV</Text>
            <Text style={styles.description}>
              Téléchargez un modèle CSV pour préparer vos questions dans Excel.
            </Text>

            <TouchableOpacity onPress={exportCSVTemplate}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.actionButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="document-text-outline" size={24} color={theme.colors.white} />
                <Text style={styles.buttonText}>Télécharger le Modèle</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Format CSV requis :</Text>
              <Text style={styles.infoText}>• theme_name - Nom du thème</Text>
              <Text style={styles.infoText}>• theme_icon - Emoji du thème</Text>
              <Text style={styles.infoText}>• sub_theme_name - Nom du sous-thème</Text>
              <Text style={styles.infoText}>• question - La question</Text>
              <Text style={styles.infoText}>• correct_answer - Bonne réponse</Text>
              <Text style={styles.infoText}>• wrong_answer_1 - Mauvaise réponse 1</Text>
              <Text style={styles.infoText}>• wrong_answer_2 - Mauvaise réponse 2</Text>
              <Text style={styles.infoText}>• wrong_answer_3 - Mauvaise réponse 3</Text>
              <Text style={styles.infoText}>• explanation - Explication (optionnel)</Text>
            </View>
          </View>

          {/* Web Admin Info */}
          <View style={styles.webAdminCard}>
            <Ionicons name="information-circle" size={24} color="#8B5CF6" />
            <Text style={styles.webAdminText}>
              Pour des fonctionnalités d'import/export avancées (CSV, Excel),
              utilisez l'interface web admin sur votre ordinateur.
            </Text>
          </View>
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
  content: {
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  description: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  statsTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  statsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.typography.fontSize.sm,
    marginBottom: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  infoTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.typography.fontSize.xs,
    marginBottom: 4,
  },
  webAdminCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  webAdminText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
});
