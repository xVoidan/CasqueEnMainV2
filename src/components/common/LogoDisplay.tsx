import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface ILogoDisplayProps {
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
  showHalo?: boolean;
  showParticles?: boolean;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  logoWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  shine: {
    position: 'absolute',
    zIndex: 3,
  },
  shadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    transform: [{ scaleX: 1.2 }],
  },
  particle: {
    position: 'absolute',
  },
});

export function LogoDisplay({
  size = 120,
  animated = true,
  style,
  showHalo = true,
  showParticles = false,
}: ILogoDisplayProps): React.ReactElement {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const particlesAnim = useRef([...Array(6)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!animated) {
      return;
    }

    // Animation de pulsation douce
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Animation de rotation lente
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        useNativeDriver: true,
      }),
    ).start();

    // Animation du halo lumineux
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Animation des particules
    if (showParticles) {
      particlesAnim.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.parallel([
              Animated.timing(anim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ).start();
      });
    }
  }, [animated, pulseAnim, rotateAnim, glowAnim, particlesAnim, showParticles]);

  const renderParticles = (): React.ReactElement[] => {
    if (!showParticles) {
      return [];
    }

    return particlesAnim.map((anim, index) => {
      const angle = (index * 60) * Math.PI / 180;
      const radius = size * 0.8;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const particleColor = index % 2 === 0 ? '#ff4444' : '#4444ff';

      return (
        <Animated.View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: particleColor,
              opacity: anim,
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, x],
                  }),
                },
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, y],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1.5, 0],
                  }),
                },
              ],
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Halo de fond avec dégradé */}
      {showHalo && (
        <>
          <Animated.View
            style={[
              styles.halo,
              {
                width: size * 2.5,
                height: size * 2.5,
                borderRadius: size * 1.25,
                opacity: glowAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.1)', 'transparent']}
              style={[StyleSheet.absoluteFillObject, { borderRadius: size * 1.25 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>

          {/* Second halo circulaire */}
          <Animated.View
            style={[
              styles.halo,
              {
                width: size * 1.6,
                height: size * 1.6,
                borderRadius: size * 0.8,
                overflow: 'hidden',
                opacity: glowAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(102, 126, 234, 0.15)', 'rgba(255, 255, 255, 0.1)', 'transparent']}
              style={[StyleSheet.absoluteFillObject, { borderRadius: size * 0.8 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              locations={[0, 0.3, 0.7, 1]}
            />
          </Animated.View>
        </>
      )}

      {/* Particules animées */}
      {renderParticles()}

      {/* Container principal du logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {/* Effet de verre dépoli */}
        <BlurView intensity={5} style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.95)']}
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius: size / 2 },
            ]}
          />
        </BlurView>

        {/* Logo */}
        <View style={[styles.logoWrapper, { width: size, height: size }]}>
          <Image
            source={require('../../../assets/images/LogoApp.png')}
            style={{
              width: size * 1.3,
              height: size * 1.3,
              marginTop: -size * 0.15,
            }}
            resizeMode="contain"
          />
        </View>

        {/* Reflet de lumière */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.4)', 'transparent']}
          style={[
            styles.shine,
            {
              width: size * 0.5,
              height: size * 0.3,
              borderRadius: size * 0.25,
              top: size * 0.1,
            },
          ]}
        />
      </Animated.View>

      {/* Ombre portée sophistiquée */}
      <View
        style={[
          styles.shadow,
          {
            width: size * 0.8,
            height: size * 0.2,
            borderRadius: size * 0.4,
            marginTop: -size * 0.1,
          },
        ]}
      />
    </View>
  );
}