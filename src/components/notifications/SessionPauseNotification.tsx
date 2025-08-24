import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';

interface SessionPauseNotificationProps {
  visible: boolean;
  currentQuestion: number;
  totalQuestions: number;
  points: number;
  streak: number;
  onContinue: () => void;
  onQuit: () => void;
  onClose: () => void;
}

const { width: _width, height } = Dimensions.get('window');

export function SessionPauseNotification({
  visible,
  currentQuestion,
  totalQuestions,
  points,
  streak,
  onContinue,
  onQuit,
  onClose,
}: SessionPauseNotificationProps): React.ReactElement | null {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animations d'entrée
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
      ]).start();

      // Animation de la barre de progression
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 500,
        delay: 300,
        useNativeDriver: false,
      }).start();
    } else {
      // Animations de sortie
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <>
      {/* Overlay sombre */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Notification principale */}
      <Animated.View
        style={[
          styles.container,
          {
            top: insets.top + 20,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <BlurView intensity={95} tint="dark" style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.15)', 'rgba(124, 58, 237, 0.08)']}
            style={styles.gradientContainer}
          >
            {/* Header avec animation */}
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <Animated.View
                  style={{
                    transform: [{
                      rotate: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    }],
                  }}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#7C3AED']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="pause" size={24} color="#FFFFFF" />
                  </LinearGradient>
                </Animated.View>
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title}>Session sauvegardée</Text>
                <View style={styles.successBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.successText}>Progression enregistrée</Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>

            {/* Barre de progression animée */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progression actuelle</Text>
                <Text style={styles.progressValue}>
                  {currentQuestion}/{totalQuestions}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${progressPercentage}%`],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#8B5CF6', '#A78BFA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressGradient}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Stats avec icônes animées */}
            <View style={styles.statsGrid}>
              <Animated.View
                style={[
                  styles.statCard,
                  {
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)']}
                    style={styles.statIconBg}
                  >
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>{points}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.statCard,
                  {
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.1)']}
                    style={styles.statIconBg}
                  >
                    <Ionicons name="flame" size={20} color="#EF4444" />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Série</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.statCard,
                  {
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.statIconContainer}>
                  <LinearGradient
                    colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.1)']}
                    style={styles.statIconBg}
                  >
                    <Ionicons name="time" size={20} color="#10B981" />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>24h</Text>
                <Text style={styles.statLabel}>Validité</Text>
              </Animated.View>
            </View>

            {/* Message d'info élégant */}
            <View style={styles.infoContainer}>
              <LinearGradient
                colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
                style={styles.infoBg}
              >
                <Ionicons name="information-circle" size={16} color="#60A5FA" />
                <Text style={styles.infoText}>
                  Reprenez votre session quand vous voulez depuis l'écran d'entraînement
                </Text>
              </LinearGradient>
            </View>

            {/* Boutons d'action */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinue}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.continueGradient}
                >
                  <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.continueText}>Continuer maintenant</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quitButton}
                onPress={onQuit}
                activeOpacity={0.8}
              >
                <View style={styles.quitInner}>
                  <Ionicons name="log-out-outline" size={20} color="rgba(255, 255, 255, 0.7)" />
                  <Text style={styles.quitText}>Quitter pour plus tard</Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxWidth: 440,
    alignSelf: 'center',
    zIndex: 1000,
    borderRadius: theme.borderRadius.xl + 4,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  blurContainer: {
    borderRadius: theme.borderRadius.xl + 4,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: theme.borderRadius.xl + 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconWrapper: {
    marginRight: theme.spacing.md,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#10B981',
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressSection: {
    marginBottom: theme.spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoContainer: {
    marginBottom: theme.spacing.xl,
  },
  infoBg: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  actions: {
    gap: theme.spacing.md,
  },
  continueButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: theme.spacing.sm,
  },
  continueText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quitButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  quitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  quitText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
