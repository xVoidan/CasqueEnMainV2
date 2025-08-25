import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function ExamSelectionScreenSimple() {
  const router = useRouter();

  const handleExamSelect = () => {
    Alert.alert(
      'Mode Examen',
      'Le mode examen sera bientôt disponible ! La migration de la base de données doit être effectuée.',
      [
        { text: 'OK', style: 'default' },
      ],
    );
  };

  const goBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBack}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mode Examen</Text>
          <Text style={styles.headerSubtitle}>Conditions réelles du concours</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Préparez-vous dans les conditions réelles du concours avec un temps limité et un barème officiel.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.examCard}
          onPress={handleExamSelect}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4CAF50', '#45a049']}
            style={styles.examGradient}
          >
            <View style={styles.examHeader}>
              <Text style={styles.examTitle}>Concours Externe 2024</Text>
              <Text style={styles.examYear}>2024</Text>
            </View>

            <Text style={styles.examDescription}>
              Première session du concours externe de sapeur-pompier professionnel
            </Text>

            <View style={styles.examStats}>
              <View style={styles.examStat}>
                <Ionicons name="document-text" size={20} color="white" />
                <Text style={styles.examStatText}>20 questions</Text>
              </View>
              <View style={styles.examStat}>
                <Ionicons name="time" size={20} color="white" />
                <Text style={styles.examStatText}>60 min</Text>
              </View>
              <View style={styles.examStat}>
                <Ionicons name="trophy" size={20} color="white" />
                <Text style={styles.examStatText}>≥ 10/20</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.examCard}
          onPress={handleExamSelect}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.examGradient}
          >
            <View style={styles.practiceBadge}>
              <Text style={styles.practiceBadgeText}>BLANC</Text>
            </View>

            <View style={styles.examHeader}>
              <Text style={styles.examTitle}>Examen Blanc</Text>
              <Text style={styles.examYear}>2024</Text>
            </View>

            <Text style={styles.examDescription}>
              Examen d'entraînement non comptabilisé dans le classement officiel
            </Text>

            <View style={styles.examStats}>
              <View style={styles.examStat}>
                <Ionicons name="document-text" size={20} color="white" />
                <Text style={styles.examStatText}>20 questions</Text>
              </View>
              <View style={styles.examStat}>
                <Ionicons name="time" size={20} color="white" />
                <Text style={styles.examStatText}>60 min</Text>
              </View>
              <View style={styles.examStat}>
                <Ionicons name="trophy" size={20} color="white" />
                <Text style={styles.examStatText}>≥ 10/20</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>📚 Fonctionnalités du Mode Examen</Text>

          <View style={styles.featureItem}>
            <Ionicons name="timer-outline" size={24} color="#FF6B6B" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Timer strict</Text>
              <Text style={styles.featureDescription}>60 minutes non-stop, impossible de mettre en pause</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="calculator-outline" size={24} color="#4CAF50" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Barème officiel</Text>
              <Text style={styles.featureDescription}>+1 bonne réponse, -0.5 mauvaise ou absence</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#2196F3" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Anti-triche</Text>
              <Text style={styles.featureDescription}>Détection des sorties d'application</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="trophy-outline" size={24} color="#FFD700" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Classement</Text>
              <Text style={styles.featureDescription}>Comparez-vous aux autres candidats</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="document-text-outline" size={24} color="#9C27B0" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Certificat PDF</Text>
              <Text style={styles.featureDescription}>Génération automatique après l'examen</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  examCard: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 15,
  },
  examGradient: {
    padding: 20,
  },
  practiceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  practiceBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  examYear: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  examDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
    lineHeight: 20,
  },
  examStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  examStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examStatText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  featuresSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  featureContent: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
