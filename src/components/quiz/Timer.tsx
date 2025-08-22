import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface ITimerProps {
  duration: number; // en secondes
  onTimeUp?: () => void;
  isPaused?: boolean;
  showIcon?: boolean;
  warningThreshold?: number; // seuil d'alerte en secondes
  style?: any;
}

export function Timer({
  duration,
  onTimeUp,
  isPaused = false,
  showIcon = true,
  warningThreshold = 10,
  style,
}: ITimerProps): React.ReactElement {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isWarning = duration <= warningThreshold;

  useEffect(() => {
    if (isWarning && !isPaused) {
      // Animation de pulsation en mode warning
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWarning, isPaused, pulseAnim]);

  useEffect(() => {
    if (duration <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [duration, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (duration <= 5) return '#EF4444'; // Rouge
    if (duration <= warningThreshold) return '#F59E0B'; // Orange
    return theme.colors.white; // Blanc
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isWarning && styles.warningContainer,
        { transform: [{ scale: pulseAnim }] },
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name="time-outline"
          size={20}
          color={getTimerColor()}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, { color: getTimerColor() }]}>
        {formatTime(duration)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  warningContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
  },
});