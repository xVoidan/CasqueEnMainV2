import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';
import { theme } from '../../styles/theme';

interface IOTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: boolean;
  autoFocus?: boolean;
}

const CELL_SIZE = 52;
const CELL_SPACING = 8;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: CELL_SPACING / 2,
  },
  cellFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.gray[50],
  },
  cellFilled: {
    borderColor: theme.colors.primary,
  },
  cellError: {
    borderColor: theme.colors.error,
    backgroundColor: `${theme.colors.error}20`,
  },
  cellText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 24,
    backgroundColor: theme.colors.primary,
  },
});

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
  autoFocus = true,
}: IOTPInputProps): React.ReactElement {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const cursorAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  useEffect(() => {
    if (error) {
      // Shake animation on error
      Vibration.vibrate(100);
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, shakeAnimation]);

  useEffect(() => {
    // Cursor blinking animation
    if (isFocused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      cursorAnimation.stopAnimation();
    }
  }, [isFocused, cursorAnimation]);

  const handlePress = (): void => {
    inputRef.current?.focus();
  };

  const handleChange = (text: string): void => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length <= length) {
      onChange(numericText);
    }
  };

  const renderCell = (index: number): React.ReactElement => {
    const digit = value[index];
    const isCurrentCell = index === value.length;
    const isCellFocused = isFocused && isCurrentCell;
    const isCellFilled = digit !== undefined;

    return (
      <Animated.View
        key={index}
        style={[
          styles.cell,
          isCellFocused && styles.cellFocused,
          isCellFilled && styles.cellFilled,
          error && styles.cellError,
          {
            transform: [{ translateX: shakeAnimation }],
          },
        ]}
      >
        {digit ? (
          <Text style={styles.cellText}>{digit}</Text>
        ) : (
          isCellFocused && (
            <Animated.View
              style={[
                styles.cursor,
                {
                  opacity: cursorAnimation,
                },
              ]}
            />
          )
        )}
      </Animated.View>
    );
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={handlePress}>
      <View style={styles.container}>
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={value}
          onChangeText={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={length}
          keyboardType="numeric"
          selectTextOnFocus
          contextMenuHidden
          caretHidden
        />
        {Array.from({ length }, (_, index) => renderCell(index))}
      </View>
    </TouchableOpacity>
  );
}
