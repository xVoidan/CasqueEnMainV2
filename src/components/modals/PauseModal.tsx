import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { theme } from '../../styles/theme';

interface PauseModalProps {
  visible: boolean;
  currentQuestion: number;
  totalQuestions: number;
  points: number;
  streak: number;
  onContinue: () => void;
  onQuit: () => void;
}

const { width } = Dimensions.get('window');

export function PauseModal({
  visible,
  currentQuestion,
  totalQuestions,
  points,
  streak,
  onContinue,
  onQuit,
}: PauseModalProps): React.ReactElement {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />

        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'rgba(124, 58, 237, 0.05)']}
            style={styles.modalGradient}
          >
            {/* Icon de pause */}
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#1E40AF', '#1E3A8A']}
                style={styles.iconGradient}
              >
                <Ionicons name="pause" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Titre */}
            <Text style={styles.title}>Session mise en pause</Text>

            {/* Message de succès */}
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.successText}>
                Progression sauvegardée avec succès !
              </Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="book-outline" size={20} color="#1E40AF" />
                <Text style={styles.statLabel}>Question</Text>
                <Text style={styles.statValue}>
                  {currentQuestion}/{totalQuestions}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                <Text style={styles.statLabel}>Points</Text>
                <Text style={styles.statValue}>{points}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="flame-outline" size={20} color="#EF4444" />
                <Text style={styles.statLabel}>Série</Text>
                <Text style={styles.statValue}>{streak}</Text>
              </View>
            </View>

            {/* Message d'info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={16} color="#3B82F6" />
              <Text style={styles.infoText}>
                Vous pourrez reprendre cette session à tout moment depuis l'écran d'entraînement
              </Text>
            </View>

            {/* Boutons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={onContinue}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#1E40AF', '#1E3A8A']}
                  style={styles.buttonGradient}
                >
                  <Ionicons name="play" size={20} color="#FFFFFF" />
                  <Text style={styles.continueButtonText}>
                    Continuer la session
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quitButton}
                onPress={onQuit}
                activeOpacity={0.8}
              >
                <View style={styles.quitButtonInner}>
                  <Ionicons name="exit-outline" size={20} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.quitButtonText}>
                    Quitter et revenir plus tard
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: theme.borderRadius.xl,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  successText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#10B981',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: theme.spacing.md,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  buttonsContainer: {
    gap: theme.spacing.md,
  },
  continueButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  continueButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quitButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  quitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  quitButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
