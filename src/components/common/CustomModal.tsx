import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { BlurView } from 'expo-blur';
import { theme } from '../../styles/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH * 0.85;

interface ICustomModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  buttons?: {
    text: string;
    onPress: () => void;
    style?: 'primary' | 'secondary' | 'danger';
    loading?: boolean;
  }[];
  icon?: keyof typeof Ionicons.glyphMap;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `${theme.colors.black}80`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: MODAL_WIDTH,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  errorIcon: {
    backgroundColor: `${theme.colors.error}15`,
  },
  successIcon: {
    backgroundColor: `${theme.colors.success}15`,
  },
  warningIcon: {
    backgroundColor: `${theme.colors.warning}15`,
  },
  infoIcon: {
    backgroundColor: `${theme.colors.primary}15`,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
    marginTop: theme.spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSeparator: {
    width: 1,
    backgroundColor: theme.colors.gray[100],
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: theme.colors.error,
  },
  dangerButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
});

export function CustomModal({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  buttons = [{ text: 'OK', onPress: onClose, style: 'primary' }],
  icon,
}: ICustomModalProps): React.ReactElement {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    if (icon) {return icon;}
    switch (type) {
      case 'error':
        return 'close-circle';
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = (): string => {
    switch (type) {
      case 'error':
        return theme.colors.error;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return '#FFA500';
      default:
        return theme.colors.primary;
    }
  };

  const getIconContainerStyle = (): object => {
    switch (type) {
      case 'error':
        return styles.errorIcon;
      case 'success':
        return styles.successIcon;
      case 'warning':
        return styles.warningIcon;
      default:
        return styles.infoIcon;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Animated.View
        style={[
          styles.overlay,
          { opacity: opacityAnim },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.iconContainer,
                getIconContainerStyle(),
                {
                  transform: [
                    {
                      rotate: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Ionicons
                name={getIconName()}
                size={40}
                color={getIconColor()}
              />
            </Animated.View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <React.Fragment key={`button-${index}`}>
                {index > 0 && <View style={styles.buttonSeparator} />}
                <TouchableOpacity
                  style={[
                    styles.button,
                    button.style === 'primary' && styles.primaryButton,
                    button.style === 'danger' && styles.dangerButton,
                  ]}
                  onPress={button.onPress}
                  disabled={button.loading}
                >
                  <Text
                    style={[
                      button.style === 'primary' && styles.primaryButtonText,
                      button.style === 'secondary' && styles.secondaryButtonText,
                      button.style === 'danger' && styles.dangerButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
