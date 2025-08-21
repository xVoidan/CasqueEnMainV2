import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';

interface ISlideTransitionProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  style?: ViewStyle;
  visible?: boolean;
}

const SLIDE_DISTANCE = 30;
const DEFAULT_DURATION = 400;

export function SlideTransition({
  children,
  direction = 'right',
  duration = DEFAULT_DURATION,
  delay = 0,
  style,
  visible = true,
}: ISlideTransitionProps): React.ReactElement {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getTranslateValue = (): number => {
      switch (direction) {
        case 'left':
          return visible ? 0 : -SLIDE_DISTANCE;
        case 'right':
          return visible ? 0 : SLIDE_DISTANCE;
        case 'up':
          return visible ? 0 : -SLIDE_DISTANCE;
        case 'down':
          return visible ? 0 : SLIDE_DISTANCE;
        default:
          return 0;
      }
    };

    Animated.parallel([
      Animated.timing(translateAnim, {
        toValue: getTranslateValue(),
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: visible ? 1 : 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, direction, duration, delay, translateAnim, opacityAnim]);

  const getTransformStyle = (): any => {
    switch (direction) {
      case 'left':
      case 'right':
        return { translateX: translateAnim };
      case 'up':
      case 'down':
        return { translateY: translateAnim };
      default:
        return {};
    }
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: opacityAnim,
          transform: [getTransformStyle()],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
