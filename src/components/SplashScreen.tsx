import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, StatusBar, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoDisplay } from './common/LogoDisplay';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface ISplashScreenProps {
  onAnimationComplete?: () => void;
}

export function CustomSplashScreen({ onAnimationComplete }: ISplashScreenProps): React.ReactElement {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const particleAnims = useRef([...Array(15)].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    // Animation d'entrée principale
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideUpAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Animation des particules de feu
      particleAnims.forEach((anim, index) => {
        const delay = index * 100;
        const randomX = (Math.random() - 0.5) * width;
        const randomY = -Math.random() * height * 0.5;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, {
              toValue: randomX,
              duration: 3000,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: randomY,
              duration: 3000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Fin de l'animation
      setTimeout(() => {
        if (onAnimationComplete) {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(textFadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(onAnimationComplete);
        }
      }, 2000);
    });
  }, [fadeAnim, textFadeAnim, slideUpAnim, particleAnims, onAnimationComplete]);

  const renderParticles = (): React.ReactElement[] => {
    return particleAnims.map((anim, index) => {
      const isRed = index % 2 === 0;
      const size = 4 + Math.random() * 4;

      return (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isRed ? '#ff6b6b' : '#ffd93d',
              opacity: anim.opacity,
              transform: [
                { translateX: anim.x },
                { translateY: anim.y },
              ],
            },
          ]}
        />
      );
    });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0f1a2e" />
      <LinearGradient
        colors={['#0f1a2e', '#1a2b4a', '#2c3e5a', '#1a2b4a', '#0f1a2e']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.5, 0.7, 1]}
      >
        {/* Effet de fumée en arrière-plan */}
        <BlurView intensity={10} style={styles.smokeEffect}>
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.02)', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </BlurView>

        {/* Particules de feu */}
        {renderParticles()}

        {/* Logo principal avec animations */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideUpAnim },
              ],
            },
          ]}
        >
          <LogoDisplay
            size={200}
            animated
            showHalo
            showParticles
          />
        </Animated.View>

        {/* Texte animé */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textFadeAnim,
              transform: [
                { translateY: slideUpAnim },
              ],
            },
          ]}
        >
          <Text style={styles.title}>Casque En Mains</Text>
          <Text style={styles.subtitle}>Préparez-vous aux concours SPP</Text>

          {/* Barre de progression animée */}
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ffd93d', '#ff6b6b']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>

          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: textFadeAnim,
              },
            ]}
          >
            Chargement...
          </Animated.Text>
        </Animated.View>

        {/* Effet de brillance diagonale */}
        <Animated.View
          style={[
            styles.shine,
            {
              opacity: fadeAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.3, 0],
              }),
              transform: [
                {
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-width * 1.5, width * 1.5],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Badge "Sapeurs-Pompiers" */}
        <Animated.View
          style={[
            styles.badge,
            {
              opacity: textFadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={['#ff6b6b', '#ff4444']}
            style={styles.badgeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.badgeText}>🚒 SAPEURS-POMPIERS PROFESSIONNELS 🚒</Text>
          </LinearGradient>
        </Animated.View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smokeEffect: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    opacity: 0.3,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 30,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  loadingText: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.7,
    marginTop: 10,
    letterSpacing: 1,
  },
  shine: {
    position: 'absolute',
    top: 0,
    width: 150,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-25deg' }],
  },
  particle: {
    position: 'absolute',
    top: height / 2,
    left: width / 2,
  },
  badge: {
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: 20,
  },
  badgeGradient: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
});
