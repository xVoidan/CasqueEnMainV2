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
import { theme } from '../../styles/theme';
import { modalTheme } from '../../styles/modalTheme';

interface SessionDeleteConfirmationProps {
  visible: boolean;
  sessionInfo: {
    currentQuestion: number;
    totalQuestions: number;
    totalPoints: number;
    correctAnswers: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

export function SessionDeleteConfirmation({
  visible,
  sessionInfo,
  onConfirm,
  onCancel,
}: SessionDeleteConfirmationProps): React.ReactElement {
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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
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
            colors={modalTheme.gradients.danger}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={48} color="#FFF" />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.title}>🚒 Supprimer la session ?</Text>
            <Text style={styles.description}>
              Vous êtes sur le point de supprimer une session en cours.
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                <Text style={styles.statText}>
                  {sessionInfo.correctAnswers} bonnes réponses
                </Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="trophy" size={20} color={theme.colors.warning} />
                <Text style={styles.statText}>
                  {sessionInfo.totalPoints.toFixed(1)} points accumulés
                </Text>
              </View>
              <View style={styles.statRow}>
                <Ionicons name="help-circle" size={20} color={theme.colors.info} />
                <Text style={styles.statText}>
                  Question {sessionInfo.currentQuestion}/{sessionInfo.totalQuestions}
                </Text>
              </View>
            </View>

            <View style={styles.warningBox}>
              <Ionicons name="information-circle" size={24} color={modalTheme.colors.danger} />
              <Text style={styles.warningText}>
                Toute votre progression sera définitivement perdue
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={onConfirm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={modalTheme.gradients.danger}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteGradient}
                >
                  <Ionicons name="trash" size={20} color="#FFF" />
                  <Text style={styles.deleteButtonText}>Supprimer</Text>
                </LinearGradient>
              </TouchableOpacity>
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
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  statText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: modalTheme.colors.border,
  },
  warningText: {
    fontSize: 14,
    color: modalTheme.colors.danger,
    marginLeft: 12,
    flex: 1,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    overflow: 'hidden',
  },
  deleteGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
    borderRadius: 16,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
