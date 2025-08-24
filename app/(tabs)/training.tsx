import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  trainingCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: theme.spacing.lg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  arrowIcon: {
    padding: theme.spacing.sm,
  },
});

export default function TrainingScreen(): React.ReactElement {
  const router = useRouter();

  const trainingModes = [
    {
      id: 'free',
      title: 'Entraînement Libre',
      description: 'Personnalisez votre session',
      icon: '🎯',
      color: ['#DC2626', '#B91C1C'],
      stats: [
        { icon: 'time-outline', value: 'Illimité' },
        { icon: 'options-outline', value: 'Configurable' },
      ],
      route: '/training/free',
    },
    {
      id: 'daily',
      title: 'Défi Quotidien',
      description: '20 questions du jour',
      icon: '⚡',
      color: ['#F59E0B', '#D97706'],
      stats: [
        { icon: 'trophy-outline', value: '+50 points' },
        { icon: 'timer-outline', value: '15 min' },
      ],
      route: '/training/daily-challenge',
    },
    {
      id: 'revision',
      title: 'Mode Révision',
      description: 'Révisez vos erreurs',
      icon: '📚',
      color: ['#8B5CF6', '#7C3AED'],
      stats: [
        { icon: 'refresh-outline', value: 'Adaptatif' },
        { icon: 'trending-up-outline', value: 'Progression' },
      ],
      route: '/training/revision',
    },
    {
      id: 'speed',
      title: 'Mode Rapide',
      description: '10 questions chrono',
      icon: '⏱️',
      color: ['#3B82F6', '#2563EB'],
      stats: [
        { icon: 'speedometer-outline', value: '30s/question' },
        { icon: 'flash-outline', value: 'Intensif' },
      ],
      route: '/training/speed',
    },
    {
      id: 'exam',
      title: 'Mode Examen',
      description: 'Conditions réelles',
      icon: '🎓',
      color: ['#10B981', '#059669'],
      stats: [
        { icon: 'school-outline', value: '40 questions' },
        { icon: 'hourglass-outline', value: '45 min' },
      ],
      route: '/training/exam',
    },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Entraînement</Text>
          <Text style={styles.subtitle}>Choisissez votre mode d'entraînement</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {trainingModes.map((mode, index) => (
            <FadeInView key={mode.id} duration={600} delay={index * 100}>
              <TouchableOpacity
                style={styles.trainingCard}
                onPress={() => router.push(mode.route as any)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={mode.color}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardIcon}>{mode.icon}</Text>
                      <Text style={styles.cardTitle}>{mode.title}</Text>
                      <Text style={styles.cardDescription}>{mode.description}</Text>
                      <View style={styles.cardStats}>
                        {mode.stats.map((stat, idx) => (
                          <View key={idx} style={styles.statItem}>
                            <Ionicons
                              name={stat.icon as any}
                              size={14}
                              color="rgba(255, 255, 255, 0.8)"
                            />
                            <Text style={styles.statText}>{stat.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={24}
                      color={theme.colors.white}
                      style={styles.arrowIcon}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </FadeInView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
