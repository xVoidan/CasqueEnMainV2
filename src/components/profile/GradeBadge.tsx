// Performance optimized
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IGrade } from '@/src/utils/grades';
import { theme } from '@/src/styles/theme';

interface IGradeBadgeProps {
  grade: IGrade;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showName?: boolean;
  showPoints?: boolean;
  points?: number;
  isNew?: boolean;
  style?: ViewStyle;
}

const SIZES = {
  small: { badge: 40, font: 10 },
  medium: { badge: 60, font: 12 },
  large: { badge: 80, font: 14 },
  xlarge: { badge: 120, font: 16 },
};

const GRADE_IMAGES: Record<string, any> = {
  '1Aspirant.png': require('@/assets/images/1Aspirant.png'),
  '2Sapeur.png': require('@/assets/images/2Sapeur.png'),
  '3Caporal.png': require('@/assets/images/3Caporal.png'),
  '4CaporalChef.png': require('@/assets/images/4CaporalChef.png'),
  '5Sergent.png': require('@/assets/images/5Sergent.png'),
  '6SergentChef.png': require('@/assets/images/6SergentChef.png'),
  '7Adjudant.png': require('@/assets/images/7Adjudant.png'),
  '8AdjudantChef.png': require('@/assets/images/8AdjudantChef.png'),
  '9Lieutenant.png': require('@/assets/images/9Lieutenant.png'),
  '10Commandant.png': require('@/assets/images/10Commandant.png'),
  '11Capitaine.png': require('@/assets/images/11Capitaine.png'),
  '12LieutenantColonel.png': require('@/assets/images/12LieutenantColonel.png'),
  '13Colonel.png': require('@/assets/images/13Colonel.png'),
  '14ControleurGeneral.png': require('@/assets/images/14ControleurGeneral.png'),
  '15ControleurGeneralEtat.png': require('@/assets/images/15ControleurGeneralEtat.png'),
};

export const GradeBadge = React.memo(function GradeBadge: React.FC<IGradeBadgeProps> = ({
  grade,
  size = 'medium',
  showName = true,
  showPoints = false,
  points,
  isNew = false,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isNew) {
      // Animation pour nouveau grade
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.3,
            useNativeDriver: true,
            tension: 100,
            friction: 3,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 3,
          }),
        ]),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ),
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          }),
        ),
      ]).start();
    }
  }, [isNew, scaleAnim, glowAnim, rotateAnim]);

  const sizeConfig = SIZES[size];
  const gradeImage = GRADE_IMAGES[grade.imageName];

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.badgeContainer,
          {
            transform: [
              { scale: scaleAnim },
              ...(isNew ? [{ rotate }] : []),
            ],
          },
        ]}
      >
        {isNew && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                width: sizeConfig.badge * 1.5,
                height: sizeConfig.badge * 1.5,
                opacity: glowAnim,
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(251, 191, 36, 0.3)', 'transparent']}
              style={styles.glowGradient}
            />
          </Animated.View>
        )}

        <View
          style={[
            styles.badge,
            {
              width: sizeConfig.badge,
              height: sizeConfig.badge,
              backgroundColor: grade.backgroundColor,
              borderColor: grade.color,
            },
          ]}
        >
          {gradeImage ? (
            <Image
              source={gradeImage}
              style={[
                styles.gradeImage,
                {
                  width: sizeConfig.badge * 0.7,
                  height: sizeConfig.badge * 0.7,
                },
              ]}
              resizeMode="contain"
            />
          ) : (
            <Text
              style={[
                styles.gradeIcon,
                {
                  fontSize: sizeConfig.badge * 0.4,
                },
              ]}
            >
              {grade.icon}
            </Text>
          )}
        </View>

        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>NEW!</Text>
          </View>
        )}
      </Animated.View>

      {showName && (
        <Text
          style={[
            styles.gradeName,
            {
              fontSize: sizeConfig.font,
              color: grade.color,
            },
          ]}
        >
          {grade.name}
        </Text>
      )}

      {showPoints && points !== undefined && (
        <Text
          style={[
            styles.gradePoints,
            {
              fontSize: sizeConfig.font * 0.9,
            },
          ]}
        >
          {points.toLocaleString()} pts
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: 999,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  gradeImage: {
    borderRadius: 999,
  },
  gradeIcon: {
    textAlign: 'center',
  },
  gradeName: {
    marginTop: theme.spacing.xs,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gradePoints: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 999,
  },
  newBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
