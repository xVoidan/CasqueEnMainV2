import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useHaptics } from '@/src/hooks/useHaptics';
import { HapticButton } from '../ui/HapticButton';
import { FadeInView } from '../animations/FadeInView';
import { theme } from '@/src/styles/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
  emoji?: string;
  image?: any;
  interactive?: React.ReactNode;
  backgroundColor: string;
  textColor?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue sur\nCasque En Mains',
    subtitle: 'L\'application de référence pour votre formation de sapeur-pompier',
    emoji: '🚒',
    backgroundColor: theme.colors.primary,
    textColor: theme.colors.white,
  },
  {
    id: 'learn',
    title: 'Apprenez à votre rythme',
    subtitle: 'Des milliers de questions pour progresser jour après jour',
    icon: 'school-outline',
    backgroundColor: '#3B82F6',
    textColor: theme.colors.white,
  },
  {
    id: 'practice',
    title: 'Entraînez-vous',
    subtitle: 'Mode révision intelligent qui s\'adapte à vos besoins',
    icon: 'fitness-outline',
    backgroundColor: '#10B981',
    textColor: theme.colors.white,
  },
  {
    id: 'progress',
    title: 'Suivez vos progrès',
    subtitle: 'Statistiques détaillées et système de grades motivant',
    icon: 'trending-up-outline',
    backgroundColor: '#F59E0B',
    textColor: theme.colors.white,
  },
  {
    id: 'compete',
    title: 'Défiez-vous',
    subtitle: 'Classements et défis quotidiens pour rester motivé',
    icon: 'trophy-outline',
    backgroundColor: '#8B5CF6',
    textColor: theme.colors.white,
  },
];

interface IInteractiveOnboardingProps {
  onComplete?: () => void;
  showSkip?: boolean;
}

export const InteractiveOnboarding: React.FC<IInteractiveOnboardingProps> = ({
  onComplete,
  showSkip = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const haptics = useHaptics();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleNext = useCallback(async () => {
    await haptics.tap();

    if (currentStep < onboardingSteps.length - 1) {
      // Animate transition
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep + 1);
        scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * (currentStep + 1), animated: true });

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      await completeOnboarding();
    }
  }, [currentStep, fadeAnim, scaleAnim, haptics]);

  const handlePrevious = useCallback(async () => {
    if (currentStep > 0) {
      await haptics.tap();
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * (currentStep - 1), animated: true });
    }
  }, [currentStep, haptics]);

  const handleSkip = useCallback(async () => {
    await haptics.tap();
    await completeOnboarding();
  }, [haptics]);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    await haptics.notification('success');

    if (onComplete) {
      onComplete();
    } else {
      router.replace('/auth/login');
    }
  };

  const handleDotPress = useCallback(async (index: number) => {
    await haptics.selection();
    setCurrentStep(index);
    scrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true });
  }, [haptics]);

  const renderStep = (step: OnboardingStep, index: number) => {
    const isActive = index === currentStep;

    return (
      <View
        key={step.id}
        style={[styles.stepContainer, { width: SCREEN_WIDTH }]}
      >
        <LinearGradient
          colors={[step.backgroundColor, `${step.backgroundColor}DD`]}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: isActive ? fadeAnim : 0.7,
                transform: [{ scale: isActive ? scaleAnim : 0.95 }],
              },
            ]}
          >
            {/* Icon/Emoji */}
            <View style={styles.iconContainer}>
              {step.emoji ? (
                <Text style={styles.emoji}>{step.emoji}</Text>
              ) : step.icon ? (
                <View style={styles.iconCircle}>
                  <Ionicons
                    name={step.icon}
                    size={80}
                    color={step.textColor || theme.colors.white}
                  />
                </View>
              ) : step.image ? (
                <Image source={step.image} style={styles.image} />
              ) : null}
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: step.textColor || theme.colors.white }]}>
              {step.title}
            </Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: `${step.textColor || theme.colors.white}DD` }]}>
              {step.subtitle}
            </Text>

            {/* Interactive element */}
            {step.interactive && (
              <FadeInView duration={600} delay={400}>
                <View style={styles.interactiveContainer}>
                  {step.interactive}
                </View>
              </FadeInView>
            )}
          </Animated.View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {showSkip && currentStep < onboardingSteps.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Steps */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {onboardingSteps.map((step, index) => renderStep(step, index))}
      </ScrollView>

      {/* Bottom navigation */}
      <View style={styles.bottomContainer}>
        {/* Dots indicator */}
        <View style={styles.dotsContainer}>
          {onboardingSteps.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              style={[
                styles.dot,
                index === currentStep && styles.activeDot,
                { backgroundColor: index === currentStep ? theme.colors.white : `${theme.colors.white}40` },
              ]}
            />
          ))}
        </View>

        {/* Navigation buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <HapticButton
              variant="ghost"
              onPress={handlePrevious}
              icon="arrow-back"
              style={styles.navButton}
            >
              <Text style={styles.navButtonText}>Précédent</Text>
            </HapticButton>
          )}

          <View style={{ flex: 1 }} />

          <HapticButton
            variant="primary"
            onPress={handleNext}
            icon={currentStep === onboardingSteps.length - 1 ? 'checkmark' : 'arrow-forward'}
            iconPosition="right"
            style={styles.navButton}
          >
            {currentStep === onboardingSteps.length - 1 ? 'Commencer' : 'Suivant'}
          </HapticButton>
        </View>
      </View>
    </View>
  );
};

// Hook pour vérifier si l'onboarding a été complété
export const useOnboardingStatus = () => {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);

  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsCompleted(completed === 'true');
    };
    checkOnboardingStatus();
  }, []);

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    setIsCompleted(false);
  };

  return { isCompleted, resetOnboarding };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    height: SCREEN_HEIGHT,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl * 2,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl * 2,
  },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 120,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: theme.spacing.lg,
  },
  interactiveContainer: {
    marginTop: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: theme.spacing.lg,
    zIndex: 10,
    padding: theme.spacing.md,
  },
  skipText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: theme.spacing.xs,
  },
  activeDot: {
    width: 24,
    height: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    minWidth: 120,
  },
  navButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
});
