import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { GradientBackground } from '../../components/common/GradientBackground';
import { theme } from '../../styles/theme';
// import LottieView from 'lottie-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: SCREEN_WIDTH * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${theme.colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  checkmark: {
    position: 'absolute',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.success,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  autoRedirectText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});

export function EmailConfirmedScreen(): React.ReactElement {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();

    // Redirection automatique après 5 secondes
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [scaleAnim, rotateAnim, fadeAnim, router]);

  const handleContinue = (): void => {
    router.replace('/(auth)/login');
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.card,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '10deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name="checkmark-done"
                size={60}
                color={theme.colors.success}
                style={styles.checkmark}
              />
            </Animated.View>

            <Text style={styles.title}>Félicitations ! 🎉</Text>
            <Text style={styles.subtitle}>Email confirmé avec succès</Text>

            <Text style={styles.message}>
              Votre compte est maintenant activé et vous pouvez accéder à toutes les fonctionnalités de l&apos;application.
              {'\n\n'}
              Préparez-vous à devenir sapeur-pompier&nbsp;&#33;
            </Text>

            <View style={styles.buttonContainer}>
              <Button
                title="Se connecter"
                onPress={handleContinue}
                size="large"
                fullWidth
              />
            </View>

            <Text style={styles.autoRedirectText}>
              Redirection automatique dans 5 secondes...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
