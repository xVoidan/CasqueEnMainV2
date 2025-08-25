import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SwipeableSectionProps {
  children: React.ReactNode;
  onSectionChange?: (index: number) => void;
}

export function SwipeableSection({ children, onSectionChange }: SwipeableSectionProps): React.ReactElement {
  const scrollX = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(0);

  // S'assurer que children est un tableau et filtrer les valeurs null/undefined/false
  const childrenArray = React.Children.toArray(children).filter(Boolean);

  const animateToSection = (index: number) => {
    Animated.spring(scrollX, {
      toValue: -index * width,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    onSectionChange?.(index);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = width * 0.25;

        if (gestureState.dx > swipeThreshold && currentIndex.current > 0) {
          currentIndex.current--;
          animateToSection(currentIndex.current);
        } else if (gestureState.dx < -swipeThreshold && currentIndex.current < childrenArray.length - 1) {
          currentIndex.current++;
          animateToSection(currentIndex.current);
        } else {
          animateToSection(currentIndex.current);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = -currentIndex.current * width + gestureState.dx;
        scrollX.setValue(newX);
      },
    }),
  ).current;

  // Si aucun enfant valide, retourner un conteneur vide
  if (childrenArray.length === 0) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.scrollContainer,
          {
            transform: [{ translateX: scrollX }],
            width: width * childrenArray.length,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {childrenArray.map((child, index) => (
          <View key={index} style={styles.section}>
            {child}
          </View>
        ))}
      </Animated.View>

      <View style={styles.indicators}>
        {childrenArray.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              index === currentIndex.current && styles.activeIndicator,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  section: {
    width,
    paddingHorizontal: 20,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeIndicator: {
    backgroundColor: '#3B82F6',
    width: 20,
  },
});
