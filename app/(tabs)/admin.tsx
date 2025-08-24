import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';
import { useAuth } from '@/src/store/AuthContext';

const ADMIN_EMAIL = 'jonathan.valsaque@gmail.com'; // Votre email admin

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  adminCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardGradient: {
    padding: theme.spacing.lg,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardStats: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  arrowIcon: {
    padding: theme.spacing.sm,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  unauthorizedIcon: {
    marginBottom: theme.spacing.lg,
  },
  unauthorizedTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  unauthorizedText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  webAdminSection: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  webAdminTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: theme.spacing.sm,
  },
  webAdminText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  webAdminUrl: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  urlText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#8B5CF6',
    fontFamily: 'monospace',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  instructionNumber: {
    fontSize: theme.typography.fontSize.sm,
    color: '#8B5CF6',
    fontWeight: 'bold',
    marginRight: theme.spacing.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 18,
  },
});

export default function AdminScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.email === ADMIN_EMAIL;

  if (!isAdmin) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.unauthorizedContainer}>
            <Ionicons
              name="lock-closed"
              size={64}
              color={theme.colors.error}
              style={styles.unauthorizedIcon}
            />
            <Text style={styles.unauthorizedTitle}>Accès Restreint</Text>
            <Text style={styles.unauthorizedText}>
              Cette section est réservée aux administrateurs.
            </Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  const adminFeatures = [
    {
      id: 'themes',
      title: 'Gestion des Thèmes',
      description: 'Ajouter, modifier ou supprimer des thèmes',
      icon: '📚',
      color: ['#3B82F6', '#2563EB'],
      stats: [
        { icon: 'folder-outline', value: '3 thèmes' },
        { icon: 'list-outline', value: '20 sous-thèmes' },
      ],
      route: '/(admin)/themes' as any,
    },
    {
      id: 'questions',
      title: 'Gestion des Questions',
      description: 'Créer et éditer les questions',
      icon: '❓',
      color: ['#10B981', '#059669'],
      stats: [
        { icon: 'help-circle-outline', value: '42 questions' },
        { icon: 'create-outline', value: 'Éditeur' },
      ],
      route: '/(admin)/questions' as any,
    },
    {
      id: 'import',
      title: 'Import/Export',
      description: 'Importer des questions en masse',
      icon: '📥',
      color: ['#F59E0B', '#D97706'],
      stats: [
        { icon: 'cloud-upload-outline', value: 'CSV/JSON' },
        { icon: 'download-outline', value: 'Backup' },
      ],
      route: '/(admin)/import-export' as any,
    },
    {
      id: 'stats',
      title: 'Statistiques',
      description: 'Analyser l\'utilisation de l\'app',
      icon: '📊',
      color: ['#8B5CF6', '#7C3AED'],
      stats: [
        { icon: 'analytics-outline', value: 'Temps réel' },
        { icon: 'trending-up-outline', value: 'Rapports' },
      ],
      route: '/(admin)/stats' as any,
    },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Administration</Text>
          <Text style={styles.subtitle}>Gérez votre application</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Section Web Admin */}
          <FadeInView duration={600} delay={0}>
            <View style={styles.webAdminSection}>
              <Text style={styles.webAdminTitle}>🌐 Interface Web Admin</Text>
              <Text style={styles.webAdminText}>
                Pour une gestion avancée, accédez à l'interface web depuis votre ordinateur :
              </Text>

              <View style={styles.webAdminUrl}>
                <Text style={styles.urlText}>https://casque-admin.vercel.app</Text>
              </View>

              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>1.</Text>
                <Text style={styles.instructionText}>
                  Connectez-vous avec votre email : {ADMIN_EMAIL}
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>2.</Text>
                <Text style={styles.instructionText}>
                  Utilisez le même mot de passe que l'app mobile
                </Text>
              </View>

              <View style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>3.</Text>
                <Text style={styles.instructionText}>
                  L'interface web offre plus de fonctionnalités (import Excel, édition en masse, etc.)
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Fonctionnalités Admin Mobile */}
          {adminFeatures.map((feature, index) => (
            <FadeInView key={feature.id} duration={600} delay={(index + 1) * 100}>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => router.push(feature.route)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={feature.color}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                      <Text style={styles.cardIcon}>{feature.icon}</Text>
                      <Text style={styles.cardTitle}>{feature.title}</Text>
                      <Text style={styles.cardDescription}>{feature.description}</Text>
                      <View style={styles.cardStats}>
                        {feature.stats.map((stat, idx) => (
                          <View key={idx} style={styles.statItem}>
                            <Ionicons
                              name={stat.icon as any}
                              size={14}
                              color="rgba(255, 255, 255, 0.8)"
                            />
                            <Text style={styles.statText}>{stat.value}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    <Ionicons
                      name="arrow-forward"
                      size={24}
                      color={theme.colors.white}
                      style={styles.arrowIcon}
                    />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </FadeInView>
          ))}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
