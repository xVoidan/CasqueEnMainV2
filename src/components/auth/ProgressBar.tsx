import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { theme } from '../../styles/theme';

interface IProgressBarProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const ANIMATION_DURATION = 300;
const DOT_SIZE = 8;
const LINE_HEIGHT = 2;

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: theme.colors.gray[300],
    zIndex: 1,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
  },
  completedDot: {
    backgroundColor: theme.colors.success,
  },
  line: {
    flex: 1,
    height: LINE_HEIGHT,
    backgroundColor: theme.colors.gray[300],
    marginHorizontal: -DOT_SIZE / 2,
  },
  activeLine: {
    backgroundColor: theme.colors.success,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  completedLabel: {
    color: theme.colors.success,
  },
});

export function ProgressBar({
  currentStep,
  totalSteps,
  labels,
}: IProgressBarProps): React.ReactElement {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep / (totalSteps - 1),
      duration: ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
  }, [currentStep, totalSteps, progressAnim]);

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepKey = `step-${index}-${currentStep}`;
          return (
            <View key={stepKey} style={styles.stepWrapper}>
              <View
                style={[
                  styles.dot,
                  index <= currentStep && styles.activeDot,
                  index < currentStep && styles.completedDot,
                ]}
              />
              {index < totalSteps - 1 && (
                <Animated.View style={[styles.line, index < currentStep && styles.activeLine]} />
              )}
            </View>
          );
        })}
      </View>
      {labels && (
        <View style={styles.labelsContainer}>
          {labels.map((label, index) => {
            const labelKey = `label-${label}-${index}`;
            return (
              <Text
                key={labelKey}
                style={[
                  styles.label,
                  index === currentStep && styles.activeLabel,
                  index < currentStep && styles.completedLabel,
                ]}
              >
                {label}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
}
