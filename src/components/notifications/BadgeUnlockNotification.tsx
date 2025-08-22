// Performance optimized
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ConfettiAnimation } from '../animations/ConfettiAnimation';
import { notificationService } from '@/src/services/notificationService';
import { theme } from '@/src/styles/theme';

interface IBadgeUnlockNotificationProps {
  isVisible: boolean;
  badge: {
    name: string;
    icon: string;
    description: string;
  } | null;
  onClose: () => void;
}

export const BadgeUnlockNotification = React.memo(function BadgeUnlockNotification: React.FC<IBadgeUnlockNotificationProps> = ({
  isVisible,
  badge,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible && badge) {
      // Jouer le son et la vibration
      notificationService.showBadgeUnlock(badge.name);

      // Animation d'entrée
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
    }
  }, [isVisible, badge]);

  if (!badge) {return null;}

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ConfettiAnimation isVisible={isVisible} />

        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { scale: scaleAnim },
                { rotate },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['#FCD34D', '#F59E0B', '#DC2626']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.content}>
              <Text style={styles.title}>🎉 NOUVEAU BADGE DÉBLOQUÉ!</Text>

              <View style={styles.badgeContainer}>
                <View style={styles.badgeBg}>
                  <Text style={styles.badgeIcon}>{badge.icon}</Text>
                </View>
              </View>

              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.badgeDescription}>{badge.description}</Text>

              <TouchableOpacity style={styles.button} onPress={onClose}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>Génial !</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    padding: theme.spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  badgeContainer: {
    marginBottom: theme.spacing.lg,
  },
  badgeBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeIcon: {
    fontSize: 64,
  },
  badgeName: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  badgeDescription: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  button: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    minWidth: 150,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  buttonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
});
