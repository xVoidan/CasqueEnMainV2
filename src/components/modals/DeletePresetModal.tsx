import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { modalTheme } from '../../styles/modalTheme';

interface DeletePresetModalProps {
  visible: boolean;
  presetName: string;
  presetIcon?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePresetModal({
  visible,
  presetName,
  presetIcon = '🎯',
  onConfirm,
  onCancel,
}: DeletePresetModalProps): React.ReactElement {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
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
        Animated.spring(scaleAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFillObject}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* Icône de suppression */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={styles.iconGradient}
              >
                <Ionicons name="trash-outline" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Titre */}
            <Text style={styles.title}>Supprimer la configuration</Text>

            {/* Configuration à supprimer */}
            <View style={styles.presetInfo}>
              <Text style={styles.presetIcon}>{presetIcon}</Text>
              <Text style={styles.presetName}>{presetName}</Text>
            </View>

            {/* Message d'avertissement */}
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <Text style={styles.warningText}>
                Cette action est irréversible. La configuration sera définitivement supprimée.
              </Text>
            </View>

            {/* Boutons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.deleteButtonGradient}
                >
                  <Ionicons name="trash" size={18} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: modalTheme.colors.surface,
    borderRadius: modalTheme.borderRadius.xxl,
    padding: modalTheme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: modalTheme.colors.borderLight,
    ...modalTheme.shadows.modal,
  },
  iconContainer: {
    marginBottom: modalTheme.spacing.lg,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...modalTheme.typography.title,
    marginBottom: modalTheme.spacing.md,
    textAlign: 'center',
  },
  presetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: modalTheme.colors.surfaceLight,
    paddingHorizontal: modalTheme.spacing.lg,
    paddingVertical: modalTheme.spacing.md,
    borderRadius: modalTheme.borderRadius.lg,
    marginBottom: modalTheme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  presetIcon: {
    fontSize: 24,
    marginRight: modalTheme.spacing.sm,
  },
  presetName: {
    ...modalTheme.typography.value,
    fontSize: 16,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: modalTheme.spacing.md,
    borderRadius: modalTheme.borderRadius.md,
    marginBottom: modalTheme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  warningText: {
    ...modalTheme.typography.subtitle,
    marginLeft: modalTheme.spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: modalTheme.spacing.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: modalTheme.colors.surfaceLight,
    paddingVertical: modalTheme.spacing.md,
    borderRadius: modalTheme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    ...modalTheme.typography.button,
    color: modalTheme.colors.textSecondary,
  },
  deleteButton: {
    flex: 1,
    borderRadius: modalTheme.borderRadius.lg,
    overflow: 'hidden',
  },
  deleteButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: modalTheme.spacing.md,
    gap: modalTheme.spacing.xs,
  },
  deleteButtonText: {
    ...modalTheme.typography.button,
    color: '#FFFFFF',
  },
});
