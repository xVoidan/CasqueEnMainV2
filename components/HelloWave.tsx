import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';

// Constants
const ROTATION_DEGREES = 25;
const ANIMATION_DURATION = 150;
const REPEAT_COUNT = 4;
const TEXT_FONT_SIZE = 28;
const TEXT_LINE_HEIGHT = 32;
const TEXT_MARGIN_TOP = -6;

const styles = StyleSheet.create({
  text: {
    fontSize: TEXT_FONT_SIZE,
    lineHeight: TEXT_LINE_HEIGHT,
    marginTop: TEXT_MARGIN_TOP,
  },
});

export function HelloWave(): React.ReactElement {
  const rotationAnimation = useSharedValue(0);

  useEffect(() => {
    rotationAnimation.value = withRepeat(
      withSequence(
        withTiming(ROTATION_DEGREES, { duration: ANIMATION_DURATION }),
        withTiming(0, { duration: ANIMATION_DURATION }),
      ),
      REPEAT_COUNT, // Run the animation 4 times
    );
  }, [rotationAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnimation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </Animated.View>
  );
}
