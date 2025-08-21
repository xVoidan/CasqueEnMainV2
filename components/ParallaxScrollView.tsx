import type { PropsWithChildren, ReactElement } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from 'react-native-reanimated';

import { ThemedView } from '@/components/ThemedView';
import { useBottomTabOverflow } from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';

// Constants
const HEADER_HEIGHT = 250;
const SCROLL_EVENT_THROTTLE = 16;
const TRANSLATE_Y_DIVISOR = 2;
const SCALE_MULTIPLIER = 0.75;
const SCALE_MAX = 2;
const SCALE_DEFAULT = 1;
const CONTENT_PADDING = 32;
const CONTENT_GAP = 16;
const FLEX_VALUE = 1;

const styles = StyleSheet.create({
  container: {
    flex: FLEX_VALUE,
  },
  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: FLEX_VALUE,
    padding: CONTENT_PADDING,
    gap: CONTENT_GAP,
    overflow: 'hidden',
  },
});

type Props = PropsWithChildren<{
  headerImage: ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}>;

export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props): ReactElement {
  const colorScheme = useColorScheme() ?? 'light';
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);
  const bottom = useBottomTabOverflow();
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [-HEADER_HEIGHT / TRANSLATE_Y_DIVISOR, 0, HEADER_HEIGHT * SCALE_MULTIPLIER],
          ),
        },
        {
          scale: interpolate(
            scrollOffset.value,
            [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
            [SCALE_MAX, SCALE_DEFAULT, SCALE_DEFAULT],
          ),
        },
      ],
    };
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        scrollIndicatorInsets={{ bottom }}
        contentContainerStyle={{ paddingBottom: bottom }}
      >
        <Animated.View
          style={[
            styles.header,
            {
              backgroundColor:
                colorScheme === 'dark' ? headerBackgroundColor.dark : headerBackgroundColor.light,
            },
            headerAnimatedStyle,
          ]}
        >
          {headerImage}
        </Animated.View>
        <ThemedView style={styles.content}>{children}</ThemedView>
      </Animated.ScrollView>
    </ThemedView>
  );
}
