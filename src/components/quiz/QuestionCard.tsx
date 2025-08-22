import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface IQuestionCardProps {
  question: string;
  imageUrl?: string;
  theme: string;
  subTheme: string;
  isMultipleChoice?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export function QuestionCard({
  question,
  imageUrl,
  theme: questionTheme,
  subTheme,
  isMultipleChoice = false,
  difficulty,
  points,
}: IQuestionCardProps): React.ReactElement {
  const getThemeIcon = (): string => {
    switch (questionTheme) {
      case 'math':
        return '📐';
      case 'french':
        return '📚';
      case 'profession':
        return '🚒';
      default:
        return '❓';
    }
  };

  const getDifficultyColor = (): string => {
    switch (difficulty) {
      case 'easy':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return theme.colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec thème et difficulté */}
      <View style={styles.header}>
        <View style={styles.themeInfo}>
          <Text style={styles.themeIcon}>{getThemeIcon()}</Text>
          <View>
            <Text style={styles.themeName}>
              {questionTheme === 'math' && 'Mathématiques'}
              {questionTheme === 'french' && 'Français'}
              {questionTheme === 'profession' && 'Métier'}
            </Text>
            <Text style={styles.subThemeName}>{subTheme}</Text>
          </View>
        </View>

        {difficulty && (
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor() }]}>
            <Text style={styles.difficultyText}>
              {difficulty === 'easy' && 'Facile'}
              {difficulty === 'medium' && 'Moyen'}
              {difficulty === 'hard' && 'Difficile'}
            </Text>
          </View>
        )}
      </View>

      {/* Question */}
      <Text style={styles.questionText}>{question}</Text>

      {/* Image optionnelle */}
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={styles.questionImage}
          resizeMode="contain"
        />
      )}

      {/* Indicateurs */}
      <View style={styles.indicators}>
        {isMultipleChoice && (
          <View style={styles.multipleChoiceInfo}>
            <Ionicons name="checkbox-outline" size={16} color="#F59E0B" />
            <Text style={styles.multipleChoiceText}>
              Plusieurs réponses possibles
            </Text>
          </View>
        )}

        {points && points > 1 && (
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsText}>+{points} pts</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIcon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  themeName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  subThemeName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textTransform: 'capitalize',
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.white,
    fontWeight: '600',
  },
  questionText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.primary,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: theme.spacing.md,
  },
  questionImage: {
    width: '100%',
    height: 200,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  multipleChoiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  multipleChoiceText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#92400E',
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  pointsInfo: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  pointsText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#1E40AF',
    fontWeight: '600',
  },
});
