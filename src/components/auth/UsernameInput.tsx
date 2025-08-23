// Performance optimized
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../common/Input';
import { UsernameValidator } from '../../services/usernameValidator';
import { theme } from '../../styles/theme';

interface IUsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onValidation?: (isValid: boolean) => void;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    paddingHorizontal: 2,
  },
  statusText: {
    fontSize: 13,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  availableText: {
    color: theme.colors.success,
  },
  unavailableText: {
    color: theme.colors.error,
  },
  checkingText: {
    color: theme.colors.text.tertiary,
  },
  suggestionsContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  suggestionsTitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  suggestionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  loadingContainer: {
    marginLeft: theme.spacing.xs,
  },
});

export function UsernameInput({
  value,
  onChange,
  error,
  onValidation,
}: IUsernameInputProps): React.ReactElement {
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | undefined>();
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!value || value.length < 3) {
      setIsAvailable(null);
      setSuggestions([]);
      return;
    }

    const checkUsername = async (): Promise<void> => {
      setIsChecking(true);
      setIsAvailable(null);
      setSuggestions([]);

      const validation = await UsernameValidator.validateWithDebounce(value, 500);

      setIsChecking(false);

      if (validation.isValid) {
        setIsAvailable(validation.isAvailable);
        setValidationError(undefined);

        if (!validation.isAvailable && validation.suggestions) {
          setSuggestions(validation.suggestions);
          // Animate suggestions appearance
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
      } else {
        setIsAvailable(false);
        setValidationError(validation.error);
      }

      onValidation?.(validation.isValid && validation.isAvailable);
    };

    void checkUsername();
  }, [value, onValidation, fadeAnim]);

  const handleSuggestionPress = (suggestion: string): void => {
    onChange(suggestion);
    setSuggestions([]);
  };

  const getStatusIcon = (): React.ReactElement | null => {
    if (isChecking) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }

    if (isAvailable === true) {
      return (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={theme.colors.success}
        />
      );
    }

    if (isAvailable === false) {
      return (
        <Ionicons
          name="close-circle"
          size={20}
          color={theme.colors.error}
        />
      );
    }

    return null;
  };

  const getStatusText = (): string => {
    if (isChecking) {
      return 'Vérification...';
    }

    if (isAvailable === true) {
      return "Nom d'utilisateur disponible";
    }

    if (isAvailable === false && !validationError) {
      return "Ce nom d'utilisateur est déjà pris";
    }

    return '';
  };

  return (
    <View style={styles.container}>
      <Input
        label="Nom d'utilisateur"
        placeholder="Choisissez un pseudo"
        value={value}
        onChangeText={onChange}
        error={error ?? validationError}
        success={isAvailable === true}
        icon="person"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length >= 3 && (
        <View style={styles.statusContainer}>
          {getStatusIcon()}
          {getStatusText() && (
            <Text
              style={[
                styles.statusText,
                isAvailable === true && styles.availableText,
                isAvailable === false && styles.unavailableText,
                isChecking && styles.checkingText,
              ]}
            >
              {getStatusText()}
            </Text>
          )}
        </View>
      )}

      {suggestions.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={styles.suggestionsTitle}>
            Suggestions disponibles :
          </Text>
          <View style={styles.suggestionsList}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );
}
