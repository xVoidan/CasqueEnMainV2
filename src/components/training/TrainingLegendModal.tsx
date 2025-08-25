import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { modalTheme } from '../../styles/modalTheme';

interface TrainingLegendModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function TrainingLegendModal({
  visible,
  onClose,
}: TrainingLegendModalProps): React.ReactElement {
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
              <Ionicons name="help-circle" size={40} color="#FFFFFF" />
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>🚒 Guide de l'entraînement</Text>
            <Text style={styles.subtitle}>
              Comprendre les éléments de l'interface
            </Text>

            {/* Barre de progression */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Barre de progression</Text>
              <View style={styles.legendItem}>
                <View style={styles.progressExample}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFillGreen, { width: '60%' }]} />
                  </View>
                </View>
                <Text style={styles.legendText}>
                  Indique votre avancement dans la session (verte)
                </Text>
              </View>
            </View>

            {/* Points de couleur */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Points de progression</Text>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.dotCorrect]} />
                <Text style={styles.legendText}>Réponse correcte</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.dotIncorrect]} />
                <Text style={styles.legendText}>Réponse incorrecte</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.dotCurrent]} />
                <Text style={styles.legendText}>Question actuelle</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.dotSkipped]} />
                <Text style={styles.legendText}>Question passée</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.dotPending]} />
                <Text style={styles.legendText}>Question à venir</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, styles.dotReview]} />
                <Text style={styles.legendText}>À revoir</Text>
              </View>
            </View>

            {/* Indicateurs */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📈 Indicateurs de performance</Text>

              <View style={styles.legendItem}>
                <View style={styles.indicatorExample}>
                  <Ionicons name="flame" size={18} color="#F59E0B" />
                  <Text style={styles.indicatorValue}>3</Text>
                </View>
                <Text style={styles.legendText}>Série en cours</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.indicatorExample}>
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text style={styles.indicatorValue}>50pts</Text>
                </View>
                <Text style={styles.legendText}>Points totaux</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.indicatorExample}>
                  <Ionicons name="speedometer" size={18} color="#8B5CF6" />
                  <Text style={styles.indicatorValue}>2.5s</Text>
                </View>
                <Text style={styles.legendText}>Temps moyen</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.indicatorExample}>
                  <Ionicons name="time-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.indicatorValue}>2:30</Text>
                </View>
                <Text style={styles.legendText}>Chronomètre</Text>
              </View>
            </View>

            {/* Boutons d'action */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎮 Actions disponibles</Text>

              <View style={styles.legendItem}>
                <View style={styles.actionButton}>
                  <Ionicons name="help-circle-outline" size={16} color="#FFF" />
                </View>
                <Text style={styles.legendText}>
                  Afficher cette aide (bouton d'aide)
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.actionButton}>
                  <Ionicons name="pause" size={16} color="#FFF" />
                </View>
                <Text style={styles.legendText}>
                  Mettre en pause et sauvegarder la progression
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.actionButtonGreen}>
                  <Text style={styles.actionButtonText}>Valider</Text>
                </View>
                <Text style={styles.legendText}>
                  Valider votre réponse (vert si disponible)
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.actionButtonOutline}>
                  <Ionicons name="arrow-forward-circle-outline" size={16} color="#FFF" />
                  <Text style={styles.actionButtonTextSmall}>Passer</Text>
                </View>
                <Text style={styles.legendText}>
                  Passer la question sans répondre
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.actionButtonGreen}>
                  <Text style={styles.actionButtonText}>Suivant</Text>
                </View>
                <Text style={styles.legendText}>
                  Passer à la question suivante (après validation)
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.actionButtonReview}>
                  <Ionicons name="bookmark-outline" size={16} color="#F59E0B" />
                  <Text style={styles.actionButtonTextReview}>Revoir</Text>
                </View>
                <Text style={styles.legendText}>
                  Marquer la question pour révision
                </Text>
              </View>
            </View>

            {/* Conseils */}
            <View style={styles.tipsSection}>
              <View style={styles.tipHeader}>
                <Ionicons name="bulb" size={20} color={modalTheme.colors.warning} />
                <Text style={styles.tipTitle}>Conseils</Text>
              </View>
              <Text style={styles.tipText}>
                • Progression sauvegardée automatiquement{'\n'}
                • Session en pause valable 24h{'\n'}
                • Points bonus avec les séries{'\n'}
                • Lisez bien chaque question
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={modalTheme.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeGradient}
              >
                <Text style={styles.closeButtonText}>Compris !</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    width: width * 0.95,
    maxWidth: 480,
    height: '90%',
    maxHeight: 800,
    backgroundColor: modalTheme.colors.surface,
    borderRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    borderWidth: 1,
    borderColor: modalTheme.colors.border,
  },
  headerGradient: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: modalTheme.typography.title.fontWeight,
    color: modalTheme.typography.title.color,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: modalTheme.typography.subtitle.color,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: modalTheme.colors.textPrimary,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 8,
    paddingRight: 8,
    minHeight: 24,
  },
  legendText: {
    fontSize: 13,
    color: modalTheme.colors.textSecondary,
    flex: 1,
    marginLeft: 12,
    lineHeight: 18,
  },
  progressExample: {
    width: 60,
    height: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: modalTheme.colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFillGreen: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  dotsExample: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  dotCorrect: {
    backgroundColor: modalTheme.colors.success,
  },
  dotIncorrect: {
    backgroundColor: modalTheme.colors.danger,
  },
  dotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  dotSkipped: {
    backgroundColor: '#6B7280',
  },
  dotPending: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotReview: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  indicatorExample: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 65,
    gap: 6,
  },
  indicatorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: modalTheme.colors.textPrimary,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: modalTheme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  actionButtonGreen: {
    height: 32,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },
  actionButtonOutline: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  actionButtonReview: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    gap: 4,
  },
  actionButtonTextReview: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F59E0B',
  },
  tipsSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: modalTheme.colors.warning,
  },
  tipText: {
    fontSize: 12,
    color: modalTheme.colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
  },
  closeButton: {
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: modalTheme.typography.button.fontSize,
    fontWeight: modalTheme.typography.button.fontWeight,
    color: modalTheme.colors.textPrimary,
  },
});
