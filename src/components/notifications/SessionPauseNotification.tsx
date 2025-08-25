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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../styles/theme';
import { modalTheme } from '../../styles/modalTheme';

interface SessionPauseNotificationProps {
  visible: boolean;
  currentQuestion: number;
  totalQuestions: number;
  points: number;
  streak: number;
  correctAnswers?: number;
  onContinue: () => void;
  onQuit: () => void;
  onFinish?: () => void;
  onClose: () => void;
}

const { width: _width, height } = Dimensions.get('window');

export function SessionPauseNotification({
  visible,
  currentQuestion,
  totalQuestions,
  points,
  streak,
  correctAnswers,
  onContinue,
  onQuit,
  onFinish,
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
        <View style={styles.blurContainer}>
          <View style={styles.gradientContainer}>
            {/* Header avec animation */}
            <View style={styles.header}>
              <View style={styles.iconWrapper}>
                <LinearGradient
                  colors={modalTheme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconGradient}
                >
                  <Ionicons name="pause-circle" size={32} color="#FFFFFF" />
                </LinearGradient>
              </View>

              <View style={styles.headerText}>
                <Text style={styles.title}>🚒 Session en pause</Text>
                <Text style={styles.subtitle}>Votre progression est sauvegardée</Text>
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
                    colors={modalTheme.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressGradient}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Stats avec icônes animées */}
            <View style={styles.statsGrid}>
              {correctAnswers !== undefined && (
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
                      colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)']}
                      style={styles.statIconBg}
                    >
                      <Ionicons name="checkmark-circle" size={20} color={modalTheme.colors.success} />
                    </LinearGradient>
                  </View>
                  <Text style={styles.statValue}>{correctAnswers}</Text>
                  <Text style={styles.statLabel}>Correctes</Text>
                </Animated.View>
              )}

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
                    colors={['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)']}
                    style={styles.statIconBg}
                  >
                    <Ionicons name="trophy" size={20} color={modalTheme.colors.warning} />
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
                    colors={['rgba(220, 38, 38, 0.15)', 'rgba(220, 38, 38, 0.05)']}
                    style={styles.statIconBg}
                  >
                    <Ionicons name="flame" size={20} color={modalTheme.colors.primary} />
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
                    colors={['rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.05)']}
                    style={styles.statIconBg}
                  >
                    <Ionicons name="time" size={20} color={modalTheme.colors.info} />
                  </LinearGradient>
                </View>
                <Text style={styles.statValue}>24h</Text>
                <Text style={styles.statLabel}>Validité</Text>
              </Animated.View>
            </View>

            {/* Message d'info élégant */}
            <View style={styles.infoContainer}>
              <View style={styles.infoBg}>
                <Ionicons name="information-circle" size={18} color={modalTheme.colors.info} />
                <Text style={styles.infoText}>
                  Votre session restera disponible pendant 24h
                </Text>
              </View>
            </View>

            {/* Boutons d'action */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinue}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={modalTheme.gradients.primary}
                  style={styles.continueGradient}
                >
                  <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.continueText}>Continuer maintenant</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.quitButton}
                  onPress={onQuit}
                  activeOpacity={0.8}
                >
                  <View style={styles.quitInner}>
                    <Ionicons name="arrow-back-outline" size={20} color={modalTheme.colors.textTertiary} />
                    <Text style={styles.quitText}>Plus tard</Text>
                  </View>
                </TouchableOpacity>

                {onFinish && (
                  <TouchableOpacity
                    style={[styles.quitButton, styles.finishButton]}
                    onPress={onFinish}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.quitInner, styles.finishInner]}>
                      <Ionicons name="stop-circle-outline" size={20} color={modalTheme.colors.danger} />
                      <Text style={[styles.quitText, styles.finishText]}>Terminer</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
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
    left: 15,
    right: 15,
    maxWidth: 380,
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
    backgroundColor: modalTheme.colors.surface,
    borderWidth: 1,
    borderColor: modalTheme.colors.border,
  },
  gradientContainer: {
    padding: theme.spacing.xl,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: modalTheme.typography.title.fontSize,
    fontWeight: modalTheme.typography.title.fontWeight,
    color: modalTheme.typography.title.color,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: modalTheme.typography.subtitle.fontSize,
    color: modalTheme.typography.subtitle.color,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: modalTheme.colors.surfaceLight,
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
    fontSize: modalTheme.typography.subtitle.fontSize,
    color: modalTheme.colors.textTertiary,
  },
  progressValue: {
    fontSize: modalTheme.typography.value.fontSize,
    fontWeight: modalTheme.typography.value.fontWeight,
    color: modalTheme.colors.primary,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: modalTheme.colors.surfaceLight,
    borderRadius: modalTheme.borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: modalTheme.colors.borderLight,
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
    backgroundColor: modalTheme.colors.surfaceLight,
    padding: 10,
    borderRadius: modalTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: modalTheme.colors.borderLight,
    minWidth: 70,
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
    fontSize: modalTheme.typography.value.fontSize,
    fontWeight: modalTheme.typography.value.fontWeight,
    color: modalTheme.typography.value.color,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: modalTheme.typography.label.fontSize,
    color: modalTheme.typography.label.color,
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
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: modalTheme.colors.textSecondary,
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
    fontSize: modalTheme.typography.button.fontSize,
    fontWeight: modalTheme.typography.button.fontWeight,
    color: modalTheme.colors.textPrimary,
  },
  quitButton: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  quitInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: modalTheme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: modalTheme.colors.borderLight,
    borderRadius: modalTheme.borderRadius.lg,
    gap: 6,
  },
  quitText: {
    fontSize: modalTheme.typography.button.fontSize - 1,
    fontWeight: modalTheme.typography.button.fontWeight,
    color: modalTheme.colors.textSecondary,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  finishButton: {
    flex: 1,
  },
  finishInner: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  finishText: {
    color: modalTheme.colors.danger,
  },
});
