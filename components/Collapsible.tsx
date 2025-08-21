import React, { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Constants
const ICON_SIZE = 18;
const ACTIVE_OPACITY = 0.8;
const CONTENT_GAP = 6;
const CONTENT_MARGIN_TOP = 6;
const CONTENT_MARGIN_LEFT = 24;

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CONTENT_GAP,
  },
  content: {
    marginTop: CONTENT_MARGIN_TOP,
    marginLeft: CONTENT_MARGIN_LEFT,
  },
});

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

  return (
    <ThemedView>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={ACTIVE_OPACITY}
      >
        <IconSymbol
          name="chevron.right"
          size={ICON_SIZE}
          weight="medium"
          color={theme === 'light' ? Colors.light.icon : Colors.dark.icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <ThemedText type="defaultSemiBold">{title}</ThemedText>
      </TouchableOpacity>
      {isOpen && <ThemedView style={styles.content}>{children}</ThemedView>}
    </ThemedView>
  );
}
