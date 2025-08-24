import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '@/src/lib/supabase';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { theme } from '@/src/styles/theme';

interface Stats {
  totalThemes: number;
  totalSubThemes: number;
  totalQuestions: number;
  totalUsers: number;
  totalSessions: number;
  averageScore: number;
  questionsPerTheme: { theme: string; icon: string; count: number }[];
  recentActivity: { date: string; sessions: number; questions: number }[];
}

export default function StatsScreen(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalThemes: 0,
    totalSubThemes: 0,
    totalQuestions: 0,
    totalUsers: 0,
    totalSessions: 0,
    averageScore: 0,
    questionsPerTheme: [],
    recentActivity: [],
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Charger les statistiques de base
      const [themesData, subThemesData, questionsData, usersData] = await Promise.all([
        supabase.from('themes').select('*', { count: 'exact', head: false }),
        supabase.from('sub_themes').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
      ]);

      // Charger les questions par thème
      const questionsPerTheme = [];
      if (themesData.data) {
        for (const theme of themesData.data) {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .in('sub_theme_id',
              (await supabase
                .from('sub_themes')
                .select('id')
                .eq('theme_id', theme.id)).data?.map(st => st.id) || [],
            );

          questionsPerTheme.push({
            theme: theme.name,
            icon: theme.icon,
            count: count || 0,
          });
        }
      }

      // Générer des données d'activité simulées
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        recentActivity.push({
          date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          sessions: Math.floor(Math.random() * 50) + 10,
          questions: Math.floor(Math.random() * 200) + 50,
        });
      }

      setStats({
        totalThemes: themesData.count || 0,
        totalSubThemes: subThemesData.count || 0,
        totalQuestions: questionsData.count || 0,
        totalUsers: usersData.count || 0,
        totalSessions: Math.floor(Math.random() * 1000) + 100,
        averageScore: Math.floor(Math.random() * 30) + 60,
        questionsPerTheme,
        recentActivity,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Statistiques</Text>
          <TouchableOpacity onPress={loadStats} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Statistiques principales */}
          <View style={styles.statsGrid}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statValue}>{stats.totalThemes}</Text>
              <Text style={styles.statLabel}>Thèmes</Text>
              <Ionicons name="folder-outline" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>

            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statValue}>{stats.totalSubThemes}</Text>
              <Text style={styles.statLabel}>Sous-thèmes</Text>
              <Ionicons name="list-outline" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>

            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statValue}>{stats.totalQuestions}</Text>
              <Text style={styles.statLabel}>Questions</Text>
              <Ionicons name="help-circle-outline" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>

            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statValue}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Utilisateurs</Text>
              <Ionicons name="people-outline" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>

            <LinearGradient
              colors={['#DC2626', '#EF4444']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
              <Ionicons name="play-circle-outline" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>

            <LinearGradient
              colors={['#06B6D4', '#0891B2']}
              style={styles.statCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.statValue}>{stats.averageScore}%</Text>
              <Text style={styles.statLabel}>Score Moyen</Text>
              <Ionicons name="trophy-outline" size={24} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
          </View>

          {/* Questions par thème */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Questions par Thème</Text>
            {stats.questionsPerTheme.map((item, index) => (
              <View key={index} style={styles.themeRow}>
                <View style={styles.themeInfo}>
                  <Text style={styles.themeIcon}>{item.icon}</Text>
                  <Text style={styles.themeName}>{item.theme}</Text>
                </View>
                <Text style={styles.themeCount}>{item.count} questions</Text>
              </View>
            ))}
          </View>

          {/* Activité récente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité des 7 derniers jours</Text>
            <View style={styles.activityChart}>
              {stats.recentActivity.map((day, index) => (
                <View key={index} style={styles.dayColumn}>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.bar,
                        { height: `${(day.sessions / 50) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.dayLabel}>{day.date}</Text>
                  <Text style={styles.dayValue}>{day.sessions}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color="#8B5CF6" />
            <Text style={styles.infoText}>
              Pour des statistiques détaillées et des graphiques avancés,
              utilisez l'interface web admin sur votre ordinateur.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  refreshButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  content: {
    padding: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    marginBottom: theme.spacing.sm,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  themeIcon: {
    fontSize: 20,
  },
  themeName: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
  },
  themeCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: theme.typography.fontSize.sm,
  },
  activityChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginTop: theme.spacing.md,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  bar: {
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
    minHeight: 10,
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: theme.spacing.xs,
  },
  dayValue: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  infoCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
});
