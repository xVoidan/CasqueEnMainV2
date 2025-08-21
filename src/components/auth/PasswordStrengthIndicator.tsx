import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../../styles/theme';

interface IPasswordStrengthIndicatorProps {
  password: string;
}

const MIN_PASSWORD_LENGTH = 8;
const ANIMATION_DURATION = 300;
const WEAK_SCORE = 2;
const MEDIUM_SCORE = 3;
const GOOD_SCORE = 4;
const OPACITY_MIN = 0.3;

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  barContainer: {
    flexDirection: 'row',
    height: 4,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  bar: {
    flex: 1,
    marginHorizontal: 1,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  strengthText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: '600',
  },
  criteriaContainer: {
    marginTop: theme.spacing.xs,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  criteriaText: {
    fontSize: theme.typography.fontSize.xs,
    marginLeft: theme.spacing.xs,
  },
  criteriaValid: {
    color: theme.colors.success,
  },
  criteriaInvalid: {
    color: theme.colors.text.tertiary,
  },
});

export function PasswordStrengthIndicator({
  password,
}: IPasswordStrengthIndicatorProps): React.ReactElement {
  const animValues = useMemo(
    () => [
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
      new Animated.Value(0),
    ],
    [],
  );

  const criteria = useMemo(
    () => ({
      length: password.length >= MIN_PASSWORD_LENGTH,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }),
    [password],
  );

  const strength = useMemo(() => {
    const score = Object.values(criteria).filter(Boolean).length;
    if (password.length === 0) {
      return { level: 0, text: '', color: theme.colors.gray[400] };
    }
    if (score <= WEAK_SCORE) {
      return { level: 1, text: 'Faible', color: theme.colors.error };
    }
    if (score === MEDIUM_SCORE) {
      return { level: 2, text: 'Moyen', color: theme.colors.warning };
    }
    if (score === GOOD_SCORE) {
      return { level: 3, text: 'Bon', color: theme.colors.info };
    }
    return { level: 4, text: 'Excellent', color: theme.colors.success };
  }, [criteria, password]);

  useEffect(() => {
    animValues.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index < strength.level ? 1 : 0,
        duration: ANIMATION_DURATION,
        useNativeDriver: false,
      }).start();
    });
  }, [strength.level, animValues]);

  if (!password) {
    return <View />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        {animValues.map((anim, index) => {
          const barKey = `strength-bar-${index}`;
          return (
            <Animated.View
              key={barKey}
              style={[
                styles.bar,
                {
                  backgroundColor: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [theme.colors.gray[200], strength.color],
                  }),
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [OPACITY_MIN, 1],
                  }),
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.strengthText, { color: strength.color }]}>{strength.text}</Text>
        <Text style={[styles.strengthText, { color: theme.colors.text.tertiary }]}>
          {password.length} caractères
        </Text>
      </View>

      <View style={styles.criteriaContainer}>
        <View style={styles.criteriaItem}>
          <Text
            style={[
              styles.criteriaText,
              criteria.length ? styles.criteriaValid : styles.criteriaInvalid,
            ]}
          >
            ✓ Au moins {MIN_PASSWORD_LENGTH} caractères
          </Text>
        </View>
        <View style={styles.criteriaItem}>
          <Text
            style={[
              styles.criteriaText,
              criteria.uppercase ? styles.criteriaValid : styles.criteriaInvalid,
            ]}
          >
            ✓ Une majuscule
          </Text>
        </View>
        <View style={styles.criteriaItem}>
          <Text
            style={[
              styles.criteriaText,
              criteria.number ? styles.criteriaValid : styles.criteriaInvalid,
            ]}
          >
            ✓ Un chiffre
          </Text>
        </View>
        <View style={styles.criteriaItem}>
          <Text
            style={[
              styles.criteriaText,
              criteria.special ? styles.criteriaValid : styles.criteriaInvalid,
            ]}
          >
            ✓ Un caractère spécial
          </Text>
        </View>
      </View>
    </View>
  );
}
