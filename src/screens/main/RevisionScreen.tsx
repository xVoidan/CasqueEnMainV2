import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/store/AuthContext';
import { styles } from './styles/RevisionScreenStyles';

interface IRevisionQuestion {
  id: string;
  question_text: string;
  theme_name: string;
  theme_color: string;
  error_count: number;
  last_attempt: string;
  is_mastered: boolean;
}

type TabType = 'review' | 'mastered';

const THEMES = [
  { id: 'all', name: 'Tous', color: theme.colors.primary },
  { id: 'incendie', name: 'Incendie', color: '#EF4444' },
  { id: 'secourisme', name: 'Secourisme', color: '#10B981' },
  { id: 'diverse', name: 'Divers', color: '#3B82F6' },
];

export const RevisionScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('review');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [questions, setQuestions] = useState<IRevisionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [activeTab, selectedTheme]);

  const loadQuestions = async (): Promise<void> => {
    if (!user) return;

    setLoading(true);
    try {
      // Récupérer les questions avec leurs statistiques
      const query = supabase
        .from('user_question_stats')
        .select(`
          question_id,
          error_count,
          last_attempt,
          is_mastered,
          questions!inner (
            question_text,
            theme_name
          )
        `)
        .eq('user_id', user.id);

      // Filtrer par statut
      if (activeTab === 'review') {
        query.eq('is_mastered', false).gt('error_count', 0);
      } else {
        query.eq('is_mastered', true);
      }

      // Filtrer par thème
      if (selectedTheme !== 'all') {
        query.eq('questions.theme_name', selectedTheme);
      }

      const { data, error } = await query
        .order('error_count', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transformer les données
      const formattedQuestions: IRevisionQuestion[] = (data || []).map((item: any) => ({
        id: item.question_id,
        question_text: item.questions.question_text,
        theme_name: item.questions.theme_name,
        theme_color: getThemeColor(item.questions.theme_name),
        error_count: item.error_count,
        last_attempt: item.last_attempt,
        is_mastered: item.is_mastered,
      }));

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Erreur chargement questions:', error);
      Alert.alert('Erreur', 'Impossible de charger les questions');
    } finally {
      setLoading(false);
    }
  };

  const getThemeColor = (themeName: string): string => {
    const theme = THEMES.find(t => t.id === themeName.toLowerCase());
    return theme?.color || '#6B7280';
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  }, [activeTab, selectedTheme]);

  const toggleMastered = async (questionId: string, currentStatus: boolean): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_question_stats')
        .update({ is_mastered: !currentStatus })
        .eq('user_id', user.id)
        .eq('question_id', questionId);

      if (error) throw error;

      // Retirer la question de la liste actuelle
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      
      Alert.alert(
        'Succès',
        currentStatus ? 'Question marquée à revoir' : 'Question maîtrisée !',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Erreur toggle mastered:', error);
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  const startRevisionSession = (): void => {
    if (questions.length === 0) {
      Alert.alert('Aucune question', 'Aucune question à réviser dans cette catégorie');
      return;
    }

    // Passer les IDs des questions à réviser
    const questionIds = questions.map(q => q.id);
    router.push({
      pathname: '/training/session',
      params: {
        mode: 'revision',
        questionIds: JSON.stringify(questionIds),
        noTimer: 'true',
        noPoints: 'true',
      },
    });
  };

  const renderRightActions = (questionId: string, isMastered: boolean) => {
    return (
      <TouchableOpacity
        style={[styles.swipeAction, isMastered ? styles.swipeUnmaster : styles.swipeMaster]}
        onPress={() => toggleMastered(questionId, isMastered)}
      >
        <Ionicons
          name={isMastered ? 'refresh' : 'checkmark-circle'}
          size={24}
          color={theme.colors.white}
        />
        <Text style={styles.swipeText}>
          {isMastered ? 'À revoir' : 'Maîtrisée'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderQuestion = (question: IRevisionQuestion) => {
    return (
      <Swipeable
        key={question.id}
        renderRightActions={() => renderRightActions(question.id, question.is_mastered)}
        overshootRight={false}
      >
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={[styles.themeBadge, { backgroundColor: question.theme_color }]}>
              <Text style={styles.themeText}>{question.theme_name}</Text>
            </View>
            {question.error_count > 0 && (
              <View style={styles.errorBadge}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
                <Text style={styles.errorCount}>{question.error_count} erreurs</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.questionText} numberOfLines={2}>
            {question.question_text}
          </Text>
          
          <Text style={styles.lastAttempt}>
            Dernière tentative: {formatDate(question.last_attempt)}
          </Text>
        </View>
      </Swipeable>
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return "Hier";
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Révisions</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'review' && styles.activeTab]}
          onPress={() => setActiveTab('review')}
        >
          <Text style={[styles.tabText, activeTab === 'review' && styles.activeTabText]}>
            À revoir ({questions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mastered' && styles.activeTab]}
          onPress={() => setActiveTab('mastered')}
        >
          <Text style={[styles.tabText, activeTab === 'mastered' && styles.activeTabText]}>
            Maîtrisées
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtres par thème */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {THEMES.map((theme) => (
          <TouchableOpacity
            key={theme.id}
            style={[
              styles.filterChip,
              selectedTheme === theme.id && styles.filterChipActive,
              { borderColor: theme.color }
            ]}
            onPress={() => setSelectedTheme(theme.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedTheme === theme.id && styles.filterTextActive,
                { color: selectedTheme === theme.id ? theme.color : theme.color }
              ]}
            >
              {theme.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des questions */}
      <ScrollView
        style={styles.questionsList}
        contentContainerStyle={styles.questionsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : questions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={64} color={theme.colors.text.secondary} />
            <Text style={styles.emptyText}>
              {activeTab === 'review' 
                ? 'Aucune question à réviser'
                : 'Aucune question maîtrisée'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'review'
                ? 'Continuez à vous entraîner pour identifier les questions difficiles'
                : 'Marquez les questions que vous maîtrisez parfaitement'}
            </Text>
          </View>
        ) : (
          <>
            {questions.map(renderQuestion)}
          </>
        )}
      </ScrollView>

      {/* Bouton Réviser */}
      {activeTab === 'review' && questions.length > 0 && (
        <TouchableOpacity style={styles.reviseButton} onPress={startRevisionSession}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.reviseGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="school" size={20} color={theme.colors.white} />
            <Text style={styles.reviseText}>
              Réviser ({questions.length} questions)
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};