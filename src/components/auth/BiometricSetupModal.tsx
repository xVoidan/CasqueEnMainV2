import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '../../hooks/useHaptics';
import { Colors } from '../../../constants/Colors';

interface IBiometricSetupModalProps {
  visible: boolean;
  biometricType: string;
  onAccept: () => void;
  onDecline: () => void;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: Colors.light.backgroundPrimary,
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.shadowColor,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  header: {
    marginBottom: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.light.backgroundAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  benefits: {
    width: '100%',
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.light.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: Colors.light.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.light.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  acceptButtonText: {
    color: Colors.light.backgroundPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  declineButton: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  declineButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  note: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export function BiometricSetupModal({
  visible,
  biometricType,
  onAccept,
  onDecline,
}: IBiometricSetupModalProps): React.ReactElement {
  const haptics = useHaptics();
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const rotateValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0);
      rotateValue.setValue(0);
    }
  }, [visible, scaleValue, rotateValue]);

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIcon = (): string => {
    if (biometricType === 'Face ID') {
      return 'scan';
    }
    if (biometricType === 'Touch ID') {
      return 'finger-print';
    }
    return 'shield-checkmark';
  };

  const handleAccept = (): void => {
    haptics.notification('success');
    onAccept();
  };

  const handleDecline = (): void => {
    haptics.impact();
    onDecline();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <View style={styles.header}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <Ionicons name={getIcon()} size={60} color={Colors.light.primary} />
            </Animated.View>
          </View>

          <Text style={styles.title}>
            Activer {biometricType} ?
          </Text>

          <Text style={styles.description}>
            Connectez-vous plus rapidement et en toute sécurité avec {biometricType}.
            {'\n\n'}
            Vos identifiants seront stockés de manière sécurisée sur cet appareil.
          </Text>

          <View style={styles.benefits}>
            <View style={styles.benefitItem}>
              <Ionicons name="flash" size={20} color={Colors.light.secondary} />
              <Text style={styles.benefitText}>Connexion instantanée</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="lock-closed" size={20} color={Colors.light.secondary} />
              <Text style={styles.benefitText}>Sécurité renforcée</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="key" size={20} color={Colors.light.secondary} />
              <Text style={styles.benefitText}>Plus besoin de mot de passe</Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={24} color={Colors.light.backgroundPrimary} />
              <Text style={styles.acceptButtonText}>Activer {biometricType}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.declineButtonText}>Plus tard</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.note}>
            Vous pourrez modifier ce paramètre à tout moment dans les réglages
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

