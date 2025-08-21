import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const CONTAINER_PADDING = 20;
const LINK_MARGIN_TOP = 15;
const LINK_PADDING_VERTICAL = 15;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: CONTAINER_PADDING,
  },
  link: {
    marginTop: LINK_MARGIN_TOP,
    paddingVertical: LINK_PADDING_VERTICAL,
  },
});

export default function NotFoundScreen(): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">This screen does not exist.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}
