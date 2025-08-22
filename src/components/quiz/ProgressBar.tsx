import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../styles/theme';

interface IProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  height?: number;
  animated?: boolean;
  colors?: string[];
  style?: any;
}

export function ProgressBar({
  current,
  total,
  showLabel = true,
  height = 4,
  animated = true,
  colors = ['#DC2626', '#EF4444'],
  style,
}: IProgressBarProps): React.ReactElement {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progress = total > 0 ? (current / total) * 100 : 0;

  useEffect(() => {
    if (animated) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated, progressAnim]);

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            Question {current} / {total}
          </Text>
          <Text style={styles.percentageText}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
      <View style={[styles.progressBarContainer, { height }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animated
                ? progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  })
                : `${progress}%`,
            },
          ]}
        >
          <LinearGradient
            colors={colors}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  labelText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    fontWeight: '600',
  },
  percentageText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});
