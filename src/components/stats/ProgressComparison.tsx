import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { modalTheme } from '../../styles/modalTheme';

interface ProgressComparisonProps {
  currentScore: number;
  lastSessionScore: number;
  averageScore: number;
  bestScore: number;
  streak: number;
  totalTime?: number;
}

export function ProgressComparison({
  currentScore,
  lastSessionScore,
  averageScore,
  bestScore,
  streak,
  totalTime = 0,
}: ProgressComparisonProps): React.ReactElement {
  const getProgressIcon = (current: number, previous: number) => {
    if (current > previous) return { name: 'trending-up', color: '#10B981' };
    if (current < previous) return { name: 'trending-down', color: '#EF4444' };
    return { name: 'remove', color: '#F59E0B' };
  };

  const progressVsLast = getProgressIcon(currentScore, lastSessionScore);
  const progressVsAvg = getProgressIcon(currentScore, averageScore);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Progression</Text>

      <View style={styles.grid}>
        {/* Streak */}
        <LinearGradient
          colors={streak >= 3 ? ['rgba(251, 146, 60, 0.2)', 'rgba(251, 146, 60, 0.05)'] : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="flame" size={20} color={streak >= 3 ? '#FB923C' : 'rgba(255, 255, 255, 0.5)'} />
            <Text style={styles.cardLabel}>Série</Text>
          </View>
          <Text style={styles.streakValue}>{streak}</Text>
          <Text style={styles.cardSubtext}>réponses correctes</Text>
        </LinearGradient>

        {/* Vs dernière session */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={progressVsLast.name as any} size={20} color={progressVsLast.color} />
            <Text style={styles.cardLabel}>Vs Dernière</Text>
          </View>
          <Text style={[styles.cardValue, { color: progressVsLast.color }]}>
            {currentScore > lastSessionScore ? '+' : ''}{(currentScore - lastSessionScore).toFixed(0)}
          </Text>
          <Text style={styles.cardSubtext}>points</Text>
        </View>

        {/* Vs moyenne */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={progressVsAvg.name as any} size={20} color={progressVsAvg.color} />
            <Text style={styles.cardLabel}>Vs Moyenne</Text>
          </View>
          <Text style={[styles.cardValue, { color: progressVsAvg.color }]}>
            {currentScore > averageScore ? '+' : ''}{(currentScore - averageScore).toFixed(0)}
          </Text>
          <Text style={styles.cardSubtext}>points</Text>
        </View>

        {/* Meilleur score */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.cardLabel}>Record</Text>
          </View>
          <Text style={styles.cardValue}>{bestScore.toFixed(0)}</Text>
          <Text style={styles.cardSubtext}>points</Text>
          {currentScore >= bestScore && (
            <View style={styles.newRecordBadge}>
              <Text style={styles.newRecordText}>NOUVEAU!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Temps total de session */}
      <View style={styles.timeCard}>
        <Ionicons name="timer-outline" size={24} color={modalTheme.colors.info} />
        <View style={styles.timeInfo}>
          <Text style={styles.timeLabel}>Durée totale de la session</Text>
          <Text style={styles.timeValue}>
            {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FB923C',
  },
  cardSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  newRecordBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newRecordText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
