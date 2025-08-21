import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

interface ISecurityBadgeProps {
  style?: object;
}

const ICON_SIZE = 16;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success}10`,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  text: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success,
    fontWeight: '600',
  },
});

export function SecurityBadge({ style }: ISecurityBadgeProps): React.ReactElement {
  return (
    <View style={[styles.container, style]}>
      <Ionicons
        name="shield-checkmark"
        size={ICON_SIZE}
        color={theme.colors.success}
        style={styles.icon}
      />
      <Text style={styles.text}>Connexion sécurisée SSL</Text>
    </View>
  );
}
