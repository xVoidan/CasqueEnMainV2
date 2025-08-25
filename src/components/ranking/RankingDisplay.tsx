import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { modalTheme } from '../../styles/modalTheme';

interface TopPlayer {
  name: string;
  points: number;
}

interface RankingDisplayProps {
  userRank: number;
  totalUsers: number;
  percentile: number;
  weeklyProgress: number;
  monthlyProgress: number;
  topPlayers?: TopPlayer[];
}

export function RankingDisplay({
  userRank,
  totalUsers,
  percentile,
  weeklyProgress,
  monthlyProgress,
  topPlayers = [],
}: RankingDisplayProps): React.ReactElement {
  const getRankIcon = () => {
    if (userRank === 1) return { name: 'trophy', color: '#FFD700' };
    if (userRank <= 3) return { name: 'medal', color: '#C0C0C0' };
    if (userRank <= 10) return { name: 'ribbon', color: '#CD7F32' };
    return { name: 'person', color: 'rgba(255, 255, 255, 0.6)' };
  };

  const rankIcon = getRankIcon();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classement & Comparaison</Text>

      <LinearGradient
        colors={userRank <= 3 ? modalTheme.gradients.gold : ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
        style={styles.rankCard}
      >
        <View style={styles.rankHeader}>
          <Ionicons name={rankIcon.name as any} size={32} color={rankIcon.color} />
          <View style={styles.rankInfo}>
            <Text style={styles.rankNumber}>#{userRank}</Text>
            <Text style={styles.rankSubtext}>sur {totalUsers} joueurs</Text>
          </View>
        </View>

        <View style={styles.percentileBar}>
          <View style={[styles.percentileFill, { width: `${percentile}%` }]} />
          <View style={[styles.percentileIndicator, { left: `${percentile}%` }]} />
        </View>
        <Text style={styles.percentileText}>
          Meilleur que {percentile}% des joueurs
        </Text>
      </LinearGradient>

      <View style={styles.progressCards}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="calendar-outline" size={16} color={modalTheme.colors.info} />
            <Text style={styles.progressLabel}>Cette semaine</Text>
          </View>
          <View style={styles.progressRow}>
            <Ionicons
              name={weeklyProgress >= 0 ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={weeklyProgress >= 0 ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.progressValue, { color: weeklyProgress >= 0 ? '#10B981' : '#EF4444' }]}>
              {Math.abs(weeklyProgress)} places
            </Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="calendar" size={16} color={modalTheme.colors.warning} />
            <Text style={styles.progressLabel}>Ce mois</Text>
          </View>
          <View style={styles.progressRow}>
            <Ionicons
              name={monthlyProgress >= 0 ? 'arrow-up' : 'arrow-down'}
              size={16}
              color={monthlyProgress >= 0 ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.progressValue, { color: monthlyProgress >= 0 ? '#10B981' : '#EF4444' }]}>
              {Math.abs(monthlyProgress)} places
            </Text>
          </View>
        </View>
      </View>

      {/* Top 3 */}
      {topPlayers.length > 0 && (
        <View style={styles.topPlayers}>
          <Text style={styles.topPlayersTitle}>Top 3 Pompiers</Text>
          <View style={styles.topPlayersList}>
            {topPlayers.slice(0, 3).map((player, index) => (
              <View key={index} style={styles.topPlayer}>
                <View style={[
                  styles.topPlayerRank,
                  { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' },
                ]}>
                  <Text style={styles.topPlayerRankText}>{index + 1}</Text>
                </View>
                <Text style={styles.topPlayerName}>{player.name}</Text>
                <Text style={styles.topPlayerScore}>{player.points.toLocaleString()} pts</Text>
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
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  rankCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rankInfo: {
    marginLeft: 12,
  },
  rankNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  percentileBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginBottom: 8,
    position: 'relative',
  },
  percentileFill: {
    height: '100%',
    backgroundColor: modalTheme.colors.primary,
    borderRadius: 4,
  },
  percentileIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: modalTheme.colors.primary,
  },
  percentileText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  progressCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  topPlayers: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topPlayersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  topPlayersList: {
    gap: 8,
  },
  topPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  topPlayerRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topPlayerRankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  topPlayerName: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  topPlayerScore: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
