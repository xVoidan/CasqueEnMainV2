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
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { theme } from '@/src/styles/theme';

interface Question {
  id: string;
  sub_theme_id: string;
  question: string;
  correct_answer: string;
  wrong_answer_1: string;
  wrong_answer_2: string;
  wrong_answer_3: string;
  explanation: string | null;
  created_at: string;
}

interface Theme {
  id: string;
  name: string;
  icon: string;
}

interface SubTheme {
  id: string;
  theme_id: string;
  name: string;
}

export default function QuestionsScreen(): React.ReactElement {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [subThemes, setSubThemes] = useState<SubTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectedSubTheme, setSelectedSubTheme] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [questionForm, setQuestionForm] = useState({
    question: '',
    correct_answer: '',
    wrong_answer_1: '',
    wrong_answer_2: '',
    wrong_answer_3: '',
    explanation: '',
  });

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (selectedTheme) {
      loadSubThemes(selectedTheme);
    }
  }, [selectedTheme]);

  useEffect(() => {
    if (selectedSubTheme) {
      loadQuestions(selectedSubTheme);
    }
  }, [selectedSubTheme]);

  const loadThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .order('name');

      if (error) throw error;
      setThemes(data || []);
      if (data && data.length > 0) {
        setSelectedTheme(data[0].id);
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
      if (data && data.length > 0) {
        setSelectedSubTheme(data[0].id);
      } else {
        setSelectedSubTheme('');
        setQuestions([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sous-thèmes:', error);
    }
  };

  const loadQuestions = async (subThemeId: string) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('sub_theme_id', subThemeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des questions:', error);
    }
  };

  const saveQuestion = async () => {
    if (!questionForm.question || !questionForm.correct_answer ||
        !questionForm.wrong_answer_1 || !questionForm.wrong_answer_2 ||
        !questionForm.wrong_answer_3) {
      Alert.alert('Erreur', 'Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (!selectedSubTheme) {
      Alert.alert('Erreur', 'Veuillez sélectionner un sous-thème');
      return;
    }

    try {
      const questionData = {
        ...questionForm,
        sub_theme_id: selectedSubTheme,
        explanation: questionForm.explanation || null,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        Alert.alert('Succès', 'Question modifiée avec succès');
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([questionData]);

        if (error) throw error;
        Alert.alert('Succès', 'Question ajoutée avec succès');
      }

      resetForm();
      loadQuestions(selectedSubTheme);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la question');
      console.error(error);
    }
  };

  const deleteQuestion = async (question: Question) => {
    Alert.alert(
      'Supprimer la question',
      'Êtes-vous sûr de vouloir supprimer cette question ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('questions')
                .delete()
                .eq('id', question.id);

              if (error) throw error;
              Alert.alert('Succès', 'Question supprimée');
              loadQuestions(selectedSubTheme);
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la question');
              console.error(error);
            }
          },
        },
      ],
    );
  };

  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      correct_answer: question.correct_answer,
      wrong_answer_1: question.wrong_answer_1,
      wrong_answer_2: question.wrong_answer_2,
      wrong_answer_3: question.wrong_answer_3,
      explanation: question.explanation || '',
    });
    setShowAddQuestion(true);
  };

  const resetForm = () => {
    setQuestionForm({
      question: '',
      correct_answer: '',
      wrong_answer_1: '',
      wrong_answer_2: '',
      wrong_answer_3: '',
      explanation: '',
    });
    setEditingQuestion(null);
    setShowAddQuestion(false);
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
          <Text style={styles.title}>Gestion des Questions</Text>
          <TouchableOpacity
            onPress={() => {
              setEditingQuestion(null);
              resetForm();
              setShowAddQuestion(true);
            }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTheme}
              onValueChange={setSelectedTheme}
              style={styles.picker}
              dropdownIconColor={theme.colors.white}
            >
              {themes.map((theme) => (
                <Picker.Item
                  key={theme.id}
                  label={`${theme.icon} ${theme.name}`}
                  value={theme.id}
                  color="#000"
                />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSubTheme}
              onValueChange={setSelectedSubTheme}
              style={styles.picker}
              dropdownIconColor={theme.colors.white}
              enabled={subThemes.length > 0}
            >
              {subThemes.map((subTheme) => (
                <Picker.Item
                  key={subTheme.id}
                  label={subTheme.name}
                  value={subTheme.id}
                  color="#000"
                />
              ))}
            </Picker>
          </View>
        </View>

        <Text style={styles.questionsCount}>
          {questions.length} question(s) dans ce sous-thème
        </Text>

        <ScrollView contentContainerStyle={styles.content}>
          {questions.map((question, index) => (
            <View key={question.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                <View style={styles.questionActions}>
                  <TouchableOpacity
                    onPress={() => editQuestion(question)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.colors.white} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteQuestion(question)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.questionText}>{question.question}</Text>

              <View style={styles.answers}>
                <View style={styles.answerItem}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                  <Text style={[styles.answerText, styles.correctAnswer]}>
                    {question.correct_answer}
                  </Text>
                </View>
                <View style={styles.answerItem}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.answerText}>{question.wrong_answer_1}</Text>
                </View>
                <View style={styles.answerItem}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.answerText}>{question.wrong_answer_2}</Text>
                </View>
                <View style={styles.answerItem}>
                  <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.answerText}>{question.wrong_answer_3}</Text>
                </View>
              </View>

              {question.explanation && (
                <View style={styles.explanation}>
                  <Ionicons name="bulb-outline" size={16} color={theme.colors.warning} />
                  <Text style={styles.explanationText}>{question.explanation}</Text>
                </View>
              )}
            </View>
          ))}

          {questions.length === 0 && (
            <Text style={styles.emptyText}>
              Aucune question dans ce sous-thème.{'\n'}
              Appuyez sur + pour en ajouter une.
            </Text>
          )}
        </ScrollView>

        {/* Modal Ajout/Édition Question */}
        <Modal
          visible={showAddQuestion}
          transparent
          animationType="slide"
          onRequestClose={resetForm}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <ScrollView>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingQuestion ? 'Modifier la' : 'Nouvelle'} Question
                </Text>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Question *"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={questionForm.question}
                  onChangeText={(text) => setQuestionForm({ ...questionForm, question: text })}
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  style={[styles.input, styles.correctInput]}
                  placeholder="Réponse correcte *"
                  placeholderTextColor="rgba(16, 185, 129, 0.7)"
                  value={questionForm.correct_answer}
                  onChangeText={(text) => setQuestionForm({ ...questionForm, correct_answer: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mauvaise réponse 1 *"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={questionForm.wrong_answer_1}
                  onChangeText={(text) => setQuestionForm({ ...questionForm, wrong_answer_1: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mauvaise réponse 2 *"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={questionForm.wrong_answer_2}
                  onChangeText={(text) => setQuestionForm({ ...questionForm, wrong_answer_2: text })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mauvaise réponse 3 *"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={questionForm.wrong_answer_3}
                  onChangeText={(text) => setQuestionForm({ ...questionForm, wrong_answer_3: text })}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Explication (optionnel)"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={questionForm.explanation}
                  onChangeText={(text) => setQuestionForm({ ...questionForm, explanation: text })}
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={resetForm}
                  >
                    <Text style={styles.buttonText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={saveQuestion}
                  >
                    <Text style={styles.buttonText}>
                      {editingQuestion ? 'Modifier' : 'Ajouter'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
  filters: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  picker: {
    color: theme.colors.white,
    height: 50,
  },
  questionsCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.typography.fontSize.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.lg,
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  questionNumber: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
  },
  questionActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    padding: theme.spacing.xs,
  },
  questionText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  answers: {
    gap: theme.spacing.sm,
  },
  answerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  answerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
  },
  correctAnswer: {
    color: theme.colors.success,
  },
  explanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: theme.borderRadius.md,
  },
  explanationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.typography.fontSize.sm,
    flex: 1,
    lineHeight: 18,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    margin: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  correctInput: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
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
