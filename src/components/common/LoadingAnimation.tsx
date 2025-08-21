import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../../styles/theme';

interface ILoadingAnimationProps {
  message?: string;
}

const HELMET_SIZE = 80;
const ROTATION_DURATION = 2000;
const DOT_SIZE = 8;
const DOT_DELAY_MULTIPLIER = 200;
const PULSE_MAX_SCALE = 1.1;
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.2;
const STRIPE_HEIGHT = 8;
const STRIPE_OPACITY = 0.3;
const TOP_STRIPE_POSITION = '30%';
const BOTTOM_STRIPE_POSITION = '60%';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  helmetContainer: {
    width: HELMET_SIZE,
    height: HELMET_SIZE,
    marginBottom: theme.spacing.lg,
  },
  helmet: {
    width: HELMET_SIZE,
    height: HELMET_SIZE,
    borderRadius: HELMET_SIZE / 2,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helmetStripe: {
    position: 'absolute',
    width: HELMET_SIZE,
    height: STRIPE_HEIGHT,
    backgroundColor: theme.colors.white,
    opacity: STRIPE_OPACITY,
  },
  helmetStripeTop: {
    top: TOP_STRIPE_POSITION,
  },
  helmetStripeBottom: {
    top: BOTTOM_STRIPE_POSITION,
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 4,
  },
});

const motivationalMessages = [
  'Préparation en cours...',
  'Vérification de votre équipement...',
  'Mise en place du matériel...',
  "Préparation de l'intervention...",
  'Chargement des ressources...',
];

export function LoadingAnimation({ message }: ILoadingAnimationProps): React.ReactElement {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const randomMessage =
    message ?? motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: ROTATION_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: PULSE_MAX_SCALE,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Dots animation
    dotAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * DOT_DELAY_MULTIPLIER),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, [rotateAnim, pulseAnim, dotAnims]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.helmetContainer,
          {
            transform: [{ rotate: rotation }, { scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.helmet}>
          <View style={[styles.helmetStripe, styles.helmetStripeTop]} />
          <View style={[styles.helmetStripe, styles.helmetStripeBottom]} />
        </View>
      </Animated.View>

      <Text style={styles.message}>{randomMessage}</Text>

      <View style={styles.dotsContainer}>
        {dotAnims.map((anim, index) => {
          const dotKey = `loading-dot-${index}`;
          return (
            <Animated.View
              key={dotKey}
              style={[
                styles.dot,
                {
                  opacity: anim,
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [SCALE_MIN, SCALE_MAX],
                      }),
                    },
                  ],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}
