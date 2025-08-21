import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { theme } from '../../styles/theme';

interface ICelebrationAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  type?: 'confetti' | 'stars' | 'fireworks';
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  lottie: {
    width: width * 0.8,
    height: height * 0.6,
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

// Fallback particle animation if Lottie assets not available
const ParticleAnimation: React.FC<{ color: string; delay: number }> = ({ color, delay }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(Math.random() * width - width / 2)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height,
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: 360,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, translateX, opacity, rotate, delay]);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg'],
            }) },
          ],
          opacity,
        },
      ]}
    />
  );
};

export function CelebrationAnimation({
  visible,
  onComplete,
  type = 'confetti',
}: ICelebrationAnimationProps): React.ReactElement | null {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Start animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after animation
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete?.();
        });
      }, 3000);
    }
  }, [visible, fadeAnim, scaleAnim, onComplete]);

  if (!visible) {return null;}

  // Try to load Lottie animation
  const lottieSource = (() => {
    switch (type) {
      case 'confetti':
        // Fallback to particle animation if no Lottie file
        return null;
      case 'stars':
        return null;
      case 'fireworks':
        return null;
      default:
        return null;
    }
  })();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {lottieSource ? (
        <LottieView
          source={lottieSource}
          autoPlay
          loop={false}
          style={styles.lottie}
        />
      ) : (
        // Fallback particle animation
        <>
          {Array.from({ length: 30 }, (_, index) => {
            const colors = [
              theme.colors.primary,
              theme.colors.success,
              theme.colors.warning,
              theme.colors.info,
              '#FF69B4',
              '#FFD700',
              '#00CED1',
            ];
            return (
              <ParticleAnimation
                key={`particle-${Date.now()}-${index}`}
                color={colors[index % 7]}
                delay={index * 50}
              />
            );
          })}
        </>
      )}
    </Animated.View>
  );
}
