import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface FeedbackData {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  streak: number;
  timePerQuestion: number;
  weakThemes: string[];
  strongThemes: string[];
  improvement: number;
}

interface PersonalizedFeedbackProps {
  data: FeedbackData;
}

export function PersonalizedFeedback({ data }: PersonalizedFeedbackProps): React.ReactElement {
  const getFeedbackLevel = () => {
    if (data.score >= 90) return 'excellent';
    if (data.score >= 75) return 'good';
    if (data.score >= 60) return 'moderate';
    return 'needsWork';
  };

  const level = getFeedbackLevel();

  const feedbackMessages = {
    excellent: {
      title: '🌟 Performance Exceptionnelle!',
      message: "Votre maîtrise est remarquable! Continuez à maintenir ce niveau d'excellence.",
      color: ['#10B981', '#059669'],
      icon: 'trophy',
      tips: [
        'Défiez-vous avec les questions difficiles',
        'Aidez vos collègues à progresser',
        'Visez le top du classement national',
      ],
    },
    good: {
      title: '💪 Très Bonne Performance!',
      message: "Vous êtes sur la bonne voie! Quelques efforts supplémentaires vous mèneront à l'excellence.",
      color: ['#3B82F6', '#2563EB'],
      icon: 'thumbs-up',
      tips: [
        'Concentrez-vous sur vos thèmes faibles',
        'Augmentez votre vitesse de réponse',
        'Maintenez votre régularité d\'entraînement',
      ],
    },
    moderate: {
      title: '📈 En Progression',
      message: 'Vous progressez bien! Continuez vos efforts pour améliorer vos résultats.',
      color: ['#F59E0B', '#D97706'],
      icon: 'trending-up',
      tips: [
        'Révisez les fondamentaux',
        'Pratiquez quotidiennement 15 minutes',
        'Utilisez les fiches de révision',
      ],
    },
    needsWork: {
      title: '🎯 Des Efforts à Fournir',
      message: 'Ne vous découragez pas! Chaque entraînement vous rapproche de vos objectifs.',
      color: ['#EF4444', '#DC2626'],
      icon: 'fitness',
      tips: [
        'Commencez par les questions faciles',
        'Relisez les cours théoriques',
        'Demandez de l\'aide à un formateur',
      ],
    },
  };

  const feedback = feedbackMessages[level];

  const getSpecificAdvice = () => {
    const advice = [];

    if (data.timePerQuestion > 10) {
      advice.push({
        icon: 'speedometer',
        text: 'Améliorez votre vitesse de réponse',
        color: '#F59E0B',
      });
    }

    if (data.weakThemes.length > 0) {
      advice.push({
        icon: 'book',
        text: `Révisez: ${data.weakThemes.slice(0, 2).join(', ')}`,
        color: '#EF4444',
      });
    }

    if (data.streak >= 5) {
      advice.push({
        icon: 'flame',
        text: `Série en cours: ${data.streak} jours!`,
        color: '#10B981',
      });
    }

    if (data.improvement > 0) {
      advice.push({
        icon: 'trending-up',
        text: `+${data.improvement}% vs dernière session`,
        color: '#3B82F6',
      });
    }

    return advice;
  };

  const specificAdvice = getSpecificAdvice();

  return (
    <View style={styles.container}>
      <LinearGradient colors={feedback.color} style={styles.header}>
        <Ionicons name={feedback.icon as any} size={48} color="#FFFFFF" />
        <Text style={styles.title}>{feedback.title}</Text>
        <Text style={styles.message}>{feedback.message}</Text>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.score}%</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.correctAnswers}</Text>
          <Text style={styles.statLabel}>Correctes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.streak}</Text>
          <Text style={styles.statLabel}>Série</Text>
        </View>
      </View>

      {specificAdvice.length > 0 && (
        <View style={styles.adviceSection}>
          <Text style={styles.adviceTitle}>Conseils Personnalisés</Text>
          {specificAdvice.map((item, index) => (
            <View key={index} style={styles.adviceItem}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={styles.adviceText}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>Prochaines Étapes</Text>
        {feedback.tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <View style={styles.tipBullet} />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>

      {data.strongThemes.length > 0 && (
        <View style={styles.strengthsSection}>
          <Text style={styles.strengthsTitle}>Points Forts</Text>
          <View style={styles.strengthsList}>
            {data.strongThemes.map((theme, index) => (
              <View key={index} style={styles.strengthItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.strengthText}>{theme}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {data.weakThemes.length > 0 && (
        <View style={styles.weaknessSection}>
          <Text style={styles.weaknessTitle}>À Améliorer</Text>
          <View style={styles.weaknessList}>
            {data.weakThemes.map((theme, index) => (
              <View key={index} style={styles.weaknessItem}>
                <Ionicons name="alert-circle" size={16} color="#F59E0B" />
                <Text style={styles.weaknessText}>{theme}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  adviceSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    flex: 1,
  },
  tipsSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 10,
  },
  tipText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
  },
  strengthsSection: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  strengthsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  strengthsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  strengthText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
  weaknessSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  weaknessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 12,
  },
  weaknessList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weaknessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  weaknessText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
  },
});
