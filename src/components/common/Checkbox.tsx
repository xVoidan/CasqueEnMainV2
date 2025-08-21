import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';
import { useHaptics } from '../../hooks/useHaptics';

interface ICheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
}

const CHECKBOX_SIZE = 24;
const ICON_SIZE = 18;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderWidth: 2,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxUnchecked: {
    borderColor: theme.colors.gray[400],
    backgroundColor: theme.colors.white,
  },
  checkboxChecked: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },
  checkboxDisabled: {
    opacity: 0.5,
  },
  label: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  labelDisabled: {
    color: theme.colors.text.tertiary,
  },
});

export function Checkbox({
  checked,
  onPress,
  label,
  disabled = false,
}: ICheckboxProps): React.ReactElement {
  const haptics = useHaptics();

  const handlePress = (): void => {
    if (!disabled) {
      haptics.selection();
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.checkbox,
          checked ? styles.checkboxChecked : styles.checkboxUnchecked,
          disabled && styles.checkboxDisabled,
        ]}
      >
        {checked && <Ionicons name="checkmark" size={ICON_SIZE} color={theme.colors.white} />}
      </View>
      {label && <Text style={[styles.label, disabled && styles.labelDisabled]}>{label}</Text>}
    </TouchableOpacity>
  );
}
