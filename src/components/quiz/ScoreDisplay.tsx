import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

interface IScoreDisplayProps {
  score: number; // Pourcentage 0-100
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  showLabel?: boolean;
  style?: any;
}

export function ScoreDisplay({
  score,
  size = 'medium',
  animated = true,
  showLabel = true,
  style,
}: IScoreDisplayProps): React.ReactElement {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Animation du score
      Animated.timing(animatedValue, {
        toValue: score,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      // Animation de rotation pour effet dynamique
      if (score >= 80) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      }
    } else {
      animatedValue.setValue(score);
    }
  }, [score, animated, animatedValue, rotateAnim]);

  const getScoreColor = (): string[] => {
    if (score >= 80) return ['#10B981', '#059669']; // Vert
    if (score >= 60) return ['#F59E0B', '#D97706']; // Orange
    return ['#EF4444', '#DC2626']; // Rouge
  };

  const getScoreEmoji = (): string => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🌟';
    if (score >= 70) return '✨';
    if (score >= 60) return '👍';
    if (score >= 50) return '💪';
    return '📚';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 80, height: 80 },
          value: { fontSize: 24 },
          label: { fontSize: 10 },
          emoji: { fontSize: 16 },
        };
      case 'large':
        return {
          container: { width: 200, height: 200 },
          value: { fontSize: 64 },
          label: { fontSize: 16 },
          emoji: { fontSize: 40 },
        };
      default: // medium
        return {
          container: { width: 140, height: 140 },
          value: { fontSize: 48 },
          label: { fontSize: 14 },
          emoji: { fontSize: 28 },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.circleContainer,
          sizeStyles.container,
          score >= 80 && { transform: [{ rotate: rotation }] },
        ]}
      >
        <LinearGradient
          colors={getScoreColor()}
          style={[styles.gradient, sizeStyles.container]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={[styles.innerContent, sizeStyles.container]}>
        <Text style={sizeStyles.emoji}>{getScoreEmoji()}</Text>
        
        <Animated.Text style={[styles.scoreValue, sizeStyles.value]}>
          {animated
            ? animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', `${Math.round(score)}%`],
              })
            : `${Math.round(score)}%`}
        </Animated.Text>
        
        {showLabel && (
          <Text style={[styles.scoreLabel, sizeStyles.label]}>
            {score >= 80 && 'Excellent !'}
            {score >= 60 && score < 80 && 'Bien joué !'}
            {score >= 40 && score < 60 && 'Pas mal'}
            {score < 40 && 'Continuez'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    position: 'absolute',
    borderRadius: 100,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: 100,
  },
  innerContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  scoreValue: {
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginVertical: 4,
  },
  scoreLabel: {
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
});