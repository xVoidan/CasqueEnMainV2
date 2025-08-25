import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string[];
  earned: boolean;
  earnedAt?: Date;
  progress?: number; // Pour les badges "presque débloqués"
  requirement?: string; // Condition pour débloquer
}

interface EnhancedBadgeDisplayProps {
  badges: Badge[];
  newBadges?: string[]; // IDs des badges nouvellement débloqués
  onBadgePress?: (badge: Badge) => void;
}

const AnimatedBadge: React.FC<{ badge: Badge; isNew: boolean; onPress?: () => void }> = ({ badge, isNew, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isNew) {
      // Animation d'apparition pour les nouveaux badges
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Animation de brillance
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    if (badge.earned && !isNew) {
      // Petite animation de rotation au survol
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [badge.earned, isNew]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View
        style={[
          styles.badgeItem,
          !badge.earned && styles.badgeItemLocked,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: badge.earned ? rotation : '0deg' },
            ],
          },
        ]}
      >
        {badge.earned ? (
          <LinearGradient
            colors={badge.color}
            style={styles.badgeIcon}
          >
            <Ionicons name={badge.icon as any} size={32} color="#FFFFFF" />
            {isNew && (
              <Animated.View
                style={[
                  styles.shimmer,
                  {
                    opacity: shimmerAnim,
                  },
                ]}
              />
            )}
          </LinearGradient>
        ) : (
          <View style={styles.badgeIconLocked}>
            <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.3)" />
            {badge.progress && badge.progress > 0 && (
              <View style={styles.progressRing}>
                <View
                  style={[
                    styles.progressFill,
                    { height: `${badge.progress}%` },
                  ]}
                />
              </View>
            )}
          </View>
        )}

        <Text style={[styles.badgeName, !badge.earned && styles.textLocked]}>
          {badge.name}
        </Text>

        {badge.earned ? (
          <Text style={[styles.badgeDescription, !badge.earned && styles.textLocked]}>
            {badge.description}
          </Text>
        ) : (
          <Text style={styles.badgeRequirement}>
            {badge.requirement || badge.description}
          </Text>
        )}

        {badge.progress && !badge.earned && (
          <Text style={styles.badgeProgress}>
            {badge.progress}% complété
          </Text>
        )}

        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NOUVEAU!</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export function EnhancedBadgeDisplay({
  badges = [],
  newBadges = [],
  onBadgePress,
}: EnhancedBadgeDisplayProps): React.ReactElement {
  const earnedBadges = badges.filter(b => b.earned);
  const almostUnlockedBadges = badges.filter(b => !b.earned && b.progress && b.progress >= 50);

  const shareBadges = async () => {
    const badgeText = earnedBadges.map(b => `🏅 ${b.name}`).join('\n');
    const message = `Mes badges CasqueEnMains:\n\n${badgeText}\n\n#CasqueEnMains #Pompiers #Badges`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error('Erreur partage badges:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏅 Badges & Récompenses</Text>
        {earnedBadges.length > 0 && (
          <TouchableOpacity onPress={shareBadges} style={styles.shareButton}>
            <Ionicons name="share-social" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Badges gagnés */}
      {earnedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges débloqués</Text>
          <View style={styles.badgeGrid}>
            {earnedBadges.map((badge) => (
              <AnimatedBadge
                key={badge.id}
                badge={badge}
                isNew={newBadges.includes(badge.id)}
                onPress={() => onBadgePress?.(badge)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Badges presque débloqués */}
      {almostUnlockedBadges.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bientôt débloqués</Text>
          <View style={styles.badgeGrid}>
            {almostUnlockedBadges.map((badge) => (
              <AnimatedBadge
                key={badge.id}
                badge={badge}
                isNew={false}
                onPress={() => onBadgePress?.(badge)}
              />
            ))}
          </View>
        </View>
      )}

      {/* Défis quotidiens */}
      <View style={styles.challengesSection}>
        <Text style={styles.challengesTitle}>Défis du jour</Text>
        <View style={styles.challengesList}>
          <View style={styles.challengeItem}>
            <View style={styles.challengeIcon}>
              <Ionicons name="flame" size={20} color="#FB923C" />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeName}>Série de feu</Text>
              <Text style={styles.challengeDesc}>10 bonnes réponses d'affilée</Text>
            </View>
            <View style={styles.challengeReward}>
              <Text style={styles.challengePoints}>+50 XP</Text>
            </View>
          </View>

          <View style={styles.challengeItem}>
            <View style={styles.challengeIcon}>
              <Ionicons name="speedometer" size={20} color="#3B82F6" />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeName}>Vitesse éclair</Text>
              <Text style={styles.challengeDesc}>Répondre en moins de 3s</Text>
            </View>
            <View style={styles.challengeReward}>
              <Text style={styles.challengePoints}>+30 XP</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  shareButton: {
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeItemLocked: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  badgeIconLocked: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
  },
  progressRing: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  badgeRequirement: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  badgeProgress: {
    fontSize: 10,
    color: '#3B82F6',
    marginTop: 4,
    fontWeight: '600',
  },
  textLocked: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  challengesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  challengesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  challengesList: {
    gap: 12,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  challengeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  challengeDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  challengeReward: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  challengePoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10B981',
  },
});
