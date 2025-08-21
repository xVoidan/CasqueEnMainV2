import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';

interface IOnboardingStepsProps {
  currentStep: number;
  totalSteps: number;
  title?: string;
}

const STEP_SIZE = 8;
const STEP_SPACING = 8;
const ACTIVE_STEP_MULTIPLIER = 3;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  step: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: STEP_SIZE / 2,
    marginHorizontal: STEP_SPACING / 2,
  },
  stepInactive: {
    backgroundColor: theme.colors.gray[300],
  },
  stepActive: {
    backgroundColor: theme.colors.primary,
    width: STEP_SIZE * ACTIVE_STEP_MULTIPLIER,
  },
  stepCompleted: {
    backgroundColor: theme.colors.success,
  },
  title: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});

export function OnboardingSteps({
  currentStep,
  totalSteps,
  title,
}: IOnboardingStepsProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.step,
              index < currentStep && styles.stepCompleted,
              index === currentStep && styles.stepActive,
              index > currentStep && styles.stepInactive,
            ]}
          />
        ))}
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
}
