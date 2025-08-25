import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { modalTheme } from '../../styles/modalTheme';

interface SessionResumeModalProps {
  visible: boolean;
  sessionInfo: {
    currentQuestion: number;
    totalQuestions: number;
    totalPoints?: number;
    correctAnswers?: number;
  };
  onResume: () => void;
  onNewSession: () => void;
  onDelete: () => void;
  onClose?: () => void;
}

const { width } = Dimensions.get('window');

export function SessionResumeModal({
  visible,
  sessionInfo,
  onResume,
  onNewSession,
  onDelete,
  onClose,
}: SessionResumeModalProps): React.ReactElement {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
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
  }, [visible]);

  const progress = ((sessionInfo.currentQuestion - 1) / sessionInfo.totalQuestions) * 100;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={modalTheme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="play-circle" size={48} color="#FFF" />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.title}>🚒 Session en cours</Text>
            <Text style={styles.description}>
              Vous avez une session non terminée
            </Text>

            {/* Barre de progression */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={modalTheme.gradients.success}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>
                Question {sessionInfo.currentQuestion}/{sessionInfo.totalQuestions}
              </Text>
            </View>

            {/* Statistiques si disponibles */}
            {(sessionInfo.totalPoints !== undefined || sessionInfo.correctAnswers !== undefined) && (
              <View style={styles.statsContainer}>
                {sessionInfo.correctAnswers !== undefined && (
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                    <Text style={styles.statText}>
                      {sessionInfo.correctAnswers} réponses correctes
                    </Text>
                  </View>
                )}
                {sessionInfo.totalPoints !== undefined && (
                  <View style={styles.statItem}>
                    <Ionicons name="trophy" size={20} color="#F59E0B" />
                    <Text style={styles.statText}>
                      {sessionInfo.totalPoints.toFixed(1)} points
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Boutons d'action */}
            <View style={styles.buttonContainer}>
              {/* Bouton Reprendre */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onResume}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={modalTheme.gradients.success}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  <Ionicons name="play" size={20} color="#FFF" />
                  <Text style={styles.primaryButtonText}>Reprendre</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Boutons secondaires */}
              <View style={styles.secondaryButtons}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onNewSession}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={20} color={modalTheme.colors.primary} />
                  <Text style={styles.secondaryButtonText}>Nouvelle</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, styles.deleteButton]}
                  onPress={onDelete}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={20} color={modalTheme.colors.danger} />
                  <Text style={[styles.secondaryButtonText, styles.deleteButtonText]}>
                    Supprimer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  card: {
    width: width * 0.85,
    maxWidth: 360,
    backgroundColor: modalTheme.colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    borderWidth: 1,
    borderColor: modalTheme.colors.border,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  statText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 10,
  },
  buttonContainer: {
    gap: 16,
  },
  primaryButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  primaryGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  deleteButton: {
    borderColor: 'rgba(220, 38, 38, 0.3)',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  deleteButtonText: {
    color: modalTheme.colors.danger,
  },
});
