import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

const GRAY_COLOR = '#808080';
const HEADER_IMAGE_SIZE = 310;
const HEADER_BOTTOM_OFFSET = -90;
const HEADER_LEFT_OFFSET = -35;

const styles = StyleSheet.create({
  headerImage: {
    color: GRAY_COLOR,
    bottom: HEADER_BOTTOM_OFFSET,
    left: HEADER_LEFT_OFFSET,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  centeredImage: {
    alignSelf: 'center',
  },
  customFont: {
    fontFamily: 'SpaceMono',
  },
});

const FileBasedRoutingSection = (): React.ReactElement => (
  <Collapsible title="File-based routing">
    <ThemedText>
      This app has two screens: <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{' '}
      and <ThemedText type="defaultSemiBold">app/(tabs)/explore.tsx</ThemedText>
    </ThemedText>
    <ThemedText>
      The layout file in <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText> sets
      up the tab navigator.
    </ThemedText>
    <ExternalLink href="https://docs.expo.dev/router/introduction">
      <ThemedText type="link">Learn more</ThemedText>
    </ExternalLink>
  </Collapsible>
);

const PlatformSupportSection = (): React.ReactElement => (
  <Collapsible title="Android, iOS, and web support">
    <ThemedText>
      You can open this project on Android, iOS, and the web. To open the web version, press{' '}
      <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
    </ThemedText>
  </Collapsible>
);

const ImagesSection = (): React.ReactElement => (
  <Collapsible title="Images">
    <ThemedText>
      For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
      <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for different
      screen densities
    </ThemedText>
    <Image source={require('@/assets/images/react-logo.png')} style={styles.centeredImage} />
    <ExternalLink href="https://reactnative.dev/docs/images">
      <ThemedText type="link">Learn more</ThemedText>
    </ExternalLink>
  </Collapsible>
);

const CustomFontsSection = (): React.ReactElement => (
  <Collapsible title="Custom fonts">
    <ThemedText>
      Open <ThemedText type="defaultSemiBold">app/_layout.tsx</ThemedText> to see how to load{' '}
      <ThemedText style={styles.customFont}>custom fonts such as this one.</ThemedText>
    </ThemedText>
    <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/font">
      <ThemedText type="link">Learn more</ThemedText>
    </ExternalLink>
  </Collapsible>
);

const ThemeSection = (): React.ReactElement => (
  <Collapsible title="Light and dark mode components">
    <ThemedText>
      This template has light and dark mode support. The{' '}
      <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect what
      the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
    </ThemedText>
    <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
      <ThemedText type="link">Learn more</ThemedText>
    </ExternalLink>
  </Collapsible>
);

const AnimationsSection = (): React.ReactElement => (
  <Collapsible title="Animations">
    <ThemedText>
      This template includes an example of an animated component. The{' '}
      <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses the
      powerful <ThemedText type="defaultSemiBold">react-native-reanimated</ThemedText> library to
      create a waving hand animation.
    </ThemedText>
    {Platform.select({
      ios: (
        <ThemedText>
          The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
          component provides a parallax effect for the header image.
        </ThemedText>
      ),
    })}
  </Collapsible>
);

export default function TabTwoScreen(): React.ReactElement {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={HEADER_IMAGE_SIZE}
          color={GRAY_COLOR}
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Explore</ThemedText>
      </ThemedView>
      <ThemedText>This app includes example code to help you get started.</ThemedText>
      <FileBasedRoutingSection />
      <PlatformSupportSection />
      <ImagesSection />
      <CustomFontsSection />
      <ThemeSection />
      <AnimationsSection />
    </ParallaxScrollView>
  );
}
