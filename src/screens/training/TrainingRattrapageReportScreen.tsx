import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from '../../components/common/GradientBackground';
import { FadeInView } from '../../components/animations/FadeInView';
import { theme } from '../../styles/theme';

export function TrainingRattrapageReportScreen(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const totalQuestions = parseInt(params.totalQuestions as string) || 0;
  const correctCount = parseInt(params.correctCount as string) || 0;
  
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const incorrectCount = totalQuestions - correctCount;
  
  // Déterminer le message et la couleur selon le score
  const getResultMessage = () => {
    if (percentage >= 80) {
      return {
        title: 'Excellent !',
        subtitle: 'Vous avez bien rattrapé vos erreurs',
        color: '#10B981',
        icon: 'trophy' as const,
      };
    } else if (percentage >= 60) {
      return {
        title: 'Bien joué !',
        subtitle: 'Vous progressez dans la bonne direction',
        color: '#F59E0B',
        icon: 'thumbs-up' as const,
      };
    } else {
      return {
        title: 'Continuez !',
        subtitle: 'La pratique mène à la perfection',
        color: '#EF4444',
        icon: 'fitness' as const,
      };
    }
  };
  
  const result = getResultMessage();
  
  const handleRetryRattrapage = () => {
    // Retourner à l'écran précédent pour relancer le rattrapage
    router.back();
  };
  
  const handleBackToHome = () => {
    router.replace('/training');
  };
  
  const handleNewSession = () => {
    router.replace('/training/config');
  };
  
  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackToHome}>
              <Ionicons name="close" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Résultats du Rattrapage</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {/* Score Circle */}
          <FadeInView duration={500}>
            <View style={styles.scoreContainer}>
              <View style={[styles.scoreCircle, { borderColor: result.color }]}>
                <Text style={[styles.scorePercentage, { color: result.color }]}>
                  {percentage}%
                </Text>
                <Text style={styles.scoreLabel}>de réussite</Text>
              </View>
              <Ionicons 
                name={result.icon} 
                size={40} 
                color={result.color} 
                style={styles.resultIcon}
              />
            </View>
          </FadeInView>
          
          {/* Result Message */}
          <FadeInView duration={600} delay={100}>
            <View style={styles.messageContainer}>
              <Text style={[styles.resultTitle, { color: result.color }]}>
                {result.title}
              </Text>
              <Text style={styles.resultSubtitle}>
                {result.subtitle}
              </Text>
            </View>
          </FadeInView>
          
          {/* Statistics */}
          <FadeInView duration={700} delay={200}>
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.statValue}>{correctCount}</Text>
                  <Text style={styles.statLabel}>Bonnes réponses</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Ionicons name="close-circle" size={24} color="#EF4444" />
                  <Text style={styles.statValue}>{incorrectCount}</Text>
                  <Text style={styles.statLabel}>Erreurs restantes</Text>
                </View>
              </View>
            </View>
          </FadeInView>
          
          {/* Progress Indicator */}
          <FadeInView duration={800} delay={300}>
            <View style={styles.progressContainer}>
              <Text style={styles.progressTitle}>Progression du rattrapage</Text>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={[result.color, result.color]}
                  style={[styles.progressFill, { width: `${percentage}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                {correctCount}/{totalQuestions} questions maîtrisées
              </Text>
            </View>
          </FadeInView>
          
          {/* Tips Section */}
          {incorrectCount > 0 && (
            <FadeInView duration={900} delay={400}>
              <View style={styles.tipsContainer}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={styles.tipsTitle}>Conseils pour progresser</Text>
                <Text style={styles.tipsText}>
                  • Relisez les explications des questions ratées{'\n'}
                  • Notez les concepts difficiles{'\n'}
                  • Refaites le rattrapage après révision
                </Text>
              </View>
            </FadeInView>
          )}
          
          {/* Action Buttons */}
          <FadeInView duration={1000} delay={500}>
            <View style={styles.actionButtons}>
              {incorrectCount > 0 && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRetryRattrapage}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#EF4444']}
                    style={styles.gradientButton}
                  >
                    <Ionicons name="refresh" size={20} color={theme.colors.white} />
                    <Text style={styles.primaryButtonText}>
                      Refaire le rattrapage
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleNewSession}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.gradientButton}
                >
                  <Ionicons name="play" size={20} color={theme.colors.white} />
                  <Text style={styles.secondaryButtonText}>
                    Nouvelle session
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={handleBackToHome}
              >
                <Text style={styles.tertiaryButtonText}>
                  Retour à l'accueil
                </Text>
              </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
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
  scoreContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scorePercentage: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: theme.spacing.xs,
  },
  resultIcon: {
    marginTop: theme.spacing.lg,
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  resultTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  resultSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  statsContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: theme.spacing.lg,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginVertical: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  progressTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: theme.spacing.sm,
  },
  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'flex-start',
  },
  tipsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    flex: 1,
  },
  tipsText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    width: '100%',
  },
  actionButtons: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  secondaryButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  tertiaryButton: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  gradientButton: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  tertiaryButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});