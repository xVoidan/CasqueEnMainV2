// Performance optimized
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ISkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const SkeletonLoader: React.FC<ISkeletonLoaderProps> = React.memo(({
  width = '100%',
  height = 20,
  borderRadius,
  style,
  variant = 'text',
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circular':
        return {
          width: typeof width === 'number' ? width : 50,
          height: typeof width === 'number' ? width : 50,
          borderRadius: typeof width === 'number' ? width / 2 : 25,
        };
      case 'rectangular':
        return {
          width,
          height,
          borderRadius: borderRadius || 8,
        };
      default: // text
        return {
          width,
          height,
          borderRadius: borderRadius || 4,
        };
    }
  };

  return (
    <View style={[styles.container, getVariantStyles(), style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );
});

SkeletonLoader.displayName = 'SkeletonLoader';

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = React.memo(({ style }) => {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <SkeletonLoader variant="circular" width={40} />
        <View style={styles.cardHeaderText}>
          <SkeletonLoader width="60%" height={16} />
          <SkeletonLoader width="40%" height={12} style={styles.dynamicStyle1} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={60} style={styles.dynamicStyle2} />
      <View style={styles.cardFooter}>
        <SkeletonLoader width="30%" height={14} />
        <SkeletonLoader width="20%" height={14} />
      </View>
    </View>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

export const SkeletonList: React.FC<{ count?: number; style?: ViewStyle }> = React.memo(({
  count = 3,
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} style={styles.dynamicStyle3} />
      ))}
    </View>
  );
});

SkeletonList.displayName = 'SkeletonList';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    width: 200,
    height: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dynamicStyle1: {
    marginTop: 4,
  },
  dynamicStyle2: {
    marginTop: 12,
  },
  dynamicStyle3: {
    marginBottom: 12,
  },
});
