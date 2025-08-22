import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface IAnswerButtonProps {
  label: string;
  text: string;
  isSelected: boolean;
  isCorrect?: boolean;
  isValidated: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
}

export function AnswerButton({
  label,
  text,
  isSelected,
  isCorrect,
  isValidated,
  onPress,
  disabled = false,
  style,
}: IAnswerButtonProps): React.ReactElement {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isValidated && isSelected && !isCorrect) {
      // Animation de secousse pour mauvaise réponse
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isValidated, isSelected, isCorrect, shakeAnim]);

  const handlePressIn = (): void => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = (): void => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = (): any => {
    if (!isValidated) {
      return isSelected ? styles.selected : styles.default;
    }

    if (isCorrect) {
      return styles.correct;
    }

    if (isSelected && !isCorrect) {
      return styles.incorrect;
    }

    return styles.default;
  };

  const getTextColor = (): string => {
    if (!isValidated) {
      return isSelected ? theme.colors.white : 'rgba(255, 255, 255, 0.9)';
    }

    if (isCorrect || (isSelected && !isCorrect)) {
      return theme.colors.white;
    }

    return 'rgba(255, 255, 255, 0.9)';
  };

  return (
    <Animated.View
      style={[
        { transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        style={[styles.button, getButtonStyle()]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isValidated}
        activeOpacity={0.8}
      >
        <View style={styles.content}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>{label}</Text>
          </View>
          
          <Text style={[styles.text, { color: getTextColor() }]}>
            {text}
          </Text>
          
          {isValidated && (
            <View style={styles.feedback}>
              {isCorrect ? (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              ) : isSelected ? (
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              ) : null}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  default: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selected: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: '#3B82F6',
  },
  correct: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: '#10B981',
  },
  incorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: '#EF4444',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  labelContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  text: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 22,
  },
  feedback: {
    marginLeft: theme.spacing.sm,
  },
});