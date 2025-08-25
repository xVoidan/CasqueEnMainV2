import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { modalTheme } from '../../styles/modalTheme';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string[];
  earned: boolean;
  earnedAt?: Date;
}

interface BadgeDisplayProps {
  badges: Badge[];
  compact?: boolean;
}

export function BadgeDisplay({ badges, compact = false }: BadgeDisplayProps): React.ReactElement {
  const displayBadges = compact ? badges.slice(0, 3) : badges;

  return (
    <View style={styles.container}>
      {!compact && <Text style={styles.title}>🏅 Badges obtenus</Text>}
      <View style={styles.badgeGrid}>
        {displayBadges.map((badge) => (
          <View
            key={badge.id}
            style={[
              styles.badgeItem,
              !badge.earned && styles.badgeItemLocked,
              compact && styles.badgeItemCompact,
            ]}
          >
            {badge.earned ? (
              <LinearGradient
                colors={badge.color}
                style={styles.badgeIcon}
              >
                <Ionicons name={badge.icon as any} size={compact ? 24 : 32} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={styles.badgeIconLocked}>
                <Ionicons name="lock-closed" size={compact ? 20 : 24} color="rgba(255,255,255,0.3)" />
              </View>
            )}
            {!compact && (
              <>
                <Text style={[styles.badgeName, !badge.earned && styles.textLocked]}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeDescription, !badge.earned && styles.textLocked]}>
                  {badge.description}
                </Text>
              </>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// Fonction pour calculer les badges
export function calculateBadges(stats: any, sessionHistory: any[] = []): Badge[] {
  const badges: Badge[] = [
    {
      id: 'first_flame',
      name: 'Première flamme',
      description: '1ère session complète',
      icon: 'flame',
      color: modalTheme.gradients.primary,
      earned: sessionHistory.length >= 1,
    },
    {
      id: 'perfect_score',
      name: 'Expert incendie',
      description: '100% de réussite',
      icon: 'trophy',
      color: modalTheme.gradients.secondary,
      earned: stats.successRate === 100,
    },
    {
      id: 'marathon',
      name: 'Marathon',
      description: '50+ questions',
      icon: 'fitness',
      color: modalTheme.gradients.success,
      earned: stats.totalQuestions >= 50,
    },
    {
      id: 'speed_demon',
      name: 'Rapide comme l\'éclair',
      description: 'Temps moyen < 5s',
      icon: 'flash',
      color: ['#F59E0B', '#EF4444'],
      earned: stats.averageTime < 5,
    },
    {
      id: 'consistency',
      name: 'Pompier confirmé',
      description: '5 sessions > 75%',
      icon: 'shield-checkmark',
      color: ['#3B82F6', '#8B5CF6'],
      earned: sessionHistory.filter(s => s.successRate > 75).length >= 5,
    },
  ];

  return badges;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: modalTheme.colors.textPrimary,
    marginBottom: 12,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 90,
  },
  badgeItemCompact: {
    minWidth: 60,
    padding: 4,
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIconLocked: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: modalTheme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 10,
    color: modalTheme.colors.textSecondary,
    textAlign: 'center',
  },
  textLocked: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
