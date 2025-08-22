import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

interface IConfettiAnimationProps {
  isVisible: boolean;
  duration?: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ConfettiAnimation: React.FC<IConfettiAnimationProps> = ({
  isVisible,
  duration = 3000,
  particleCount = 50,
  colors = ['#DC2626', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'],
  onComplete,
}) => {
  const particles = useRef<Animated.Value[]>([]);

  useEffect(() => {
    if (isVisible) {
      startAnimation();
    }
  }, [isVisible]);

  const startAnimation = (): void => {
    // Créer les particules
    particles.current = Array(particleCount).fill(0).map(() => new Animated.Value(0));

    // Animer chaque particule
    const animations = particles.current.map((particle, index) => {
      const delay = Math.random() * 500;
      const duration = 2000 + Math.random() * 1000;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.timing(particle, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      if (onComplete) {
        onComplete();
      }
    });
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => {
        const randomX = Math.random() * screenWidth;
        const randomRotation = Math.random() * 360;
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const randomSize = 8 + Math.random() * 8;

        const translateY = particle.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, screenHeight + 50],
        });

        const translateX = particle.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 400],
        });

        const rotate = particle.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${randomRotation}deg`],
        });

        const opacity = particle.interpolate({
          inputRange: [0, 0.1, 0.9, 1],
          outputRange: [0, 1, 1, 0],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: randomX,
                backgroundColor: randomColor,
                width: randomSize,
                height: randomSize,
                opacity,
                transform: [
                  { translateY },
                  { translateX },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  particle: {
    position: 'absolute',
    borderRadius: 4,
  },
});