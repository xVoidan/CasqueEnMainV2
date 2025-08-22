import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LineChart,
  PieChart,
  BarChart,
  ContributionGraph,
} from 'react-native-chart-kit';
import { useAuth } from '@/src/store/AuthContext';
import { statsService, IUserStats, IThemeStats, IProgressData } from '@/src/services/statsService';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: 'transparent',
  backgroundGradientFrom: 'rgba(255, 255, 255, 0.1)',
  backgroundGradientTo: 'rgba(255, 255, 255, 0.05)',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#DC2626',
  },
};

export const ProgressScreen: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<IUserStats | null>(null);
  const [themeStats, setThemeStats] = useState<IThemeStats[]>([]);
  const [progressData, setProgressData] = useState<IProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 30>(30);

  const loadStats = useCallback(async () => {
    if (!user?.id) {return;}

    try {
      const [stats, themes, progress] = await Promise.all([
        statsService.getUserStats(user.id),
        statsService.getThemeStats(user.id),
        statsService.getProgressData(user.id, selectedPeriod),
      ]);

      setUserStats(stats);
      setThemeStats(themes);
      setProgressData(progress);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, selectedPeriod]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadStats();
  }, [loadStats]);

  if (isLoading || !userStats || !progressData) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Préparer les données pour les graphiques
  const lineChartData = {
    labels: progressData.dailyProgress.slice(-7).map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: progressData.dailyProgress.slice(-7).map(d => d.points),
        strokeWidth: 2,
      },
    ],
  };

  const pieChartData = progressData.themeDistribution.map(theme => ({
    name: theme.theme,
    population: theme.value,
    color: theme.theme === 'Mathématiques'
      ? '#3B82F6'
      : theme.theme === 'Français'
        ? '#10B981'
        : '#F59E0B',
    legendFontColor: '#FFF',
    legendFontSize: 12,
  }));

  const barChartData = {
    labels: themeStats.map(t => t.theme.substring(0, 4)),
    datasets: [
      {
        data: themeStats.map(t => t.successRate),
      },
    ],
  };

  // Générer les données pour la heatmap
  const generateHeatmapData = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    return progressData.activityHeatmap.map(day => ({
      date: day.date,
      count: day.intensity,
    }));
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Ma Progression</Text>
          </View>

          {/* Stats globales */}
          <FadeInView duration={400} delay={0}>
            <View style={styles.statsCard}>
              <Text style={styles.sectionTitle}>Statistiques Globales</Text>

              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  <Text style={styles.statValue}>
                    {userStats.successRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.statLabel}>Taux de réussite</Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="time" size={24} color="#3B82F6" />
                  <Text style={styles.statValue}>
                    {userStats.averageTime.toFixed(0)}s
                  </Text>
                  <Text style={styles.statLabel}>Temps moyen</Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="help-circle" size={24} color="#F59E0B" />
                  <Text style={styles.statValue}>
                    {userStats.totalQuestions}
                  </Text>
                  <Text style={styles.statLabel}>Questions</Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="flame" size={24} color="#EF4444" />
                  <Text style={styles.statValue}>
                    {userStats.bestStreak}
                  </Text>
                  <Text style={styles.statLabel}>Meilleur streak</Text>
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Objectifs quotidiens */}
          <FadeInView duration={400} delay={100}>
            <View style={styles.objectivesCard}>
              <Text style={styles.sectionTitle}>Objectifs</Text>

              <View style={styles.objective}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveTitle}>Quotidien</Text>
                  <Text style={styles.objectiveProgress}>
                    {progressData.objectives.daily.current}/{progressData.objectives.daily.target} sessions
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${(progressData.objectives.daily.current / progressData.objectives.daily.target) * 100}%`,
                        backgroundColor: progressData.objectives.daily.completed ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.objective}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveTitle}>Hebdomadaire</Text>
                  <Text style={styles.objectiveProgress}>
                    {progressData.objectives.weekly.current}/{progressData.objectives.weekly.target} sessions
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${(progressData.objectives.weekly.current / progressData.objectives.weekly.target) * 100}%`,
                        backgroundColor: progressData.objectives.weekly.completed ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </FadeInView>

          {/* Graphique de progression */}
          <FadeInView duration={400} delay={200}>
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.sectionTitle}>Évolution des points</Text>
                <View style={styles.periodSelector}>
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 7 && styles.activePeriodButton]}
                    onPress={() => setSelectedPeriod(7)}
                  >
                    <Text style={[styles.periodButtonText, selectedPeriod === 7 && styles.activePeriodButtonText]}>
                      7j
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 30 && styles.activePeriodButton]}
                    onPress={() => setSelectedPeriod(30)}
                  >
                    <Text style={[styles.periodButtonText, selectedPeriod === 30 && styles.activePeriodButtonText]}>
                      30j
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <LineChart
                data={lineChartData}
                width={screenWidth - theme.spacing.lg * 2 - theme.spacing.md * 2}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines={false}
                withOuterLines={false}
              />
            </View>
          </FadeInView>

          {/* Répartition par thème */}
          {pieChartData.length > 0 && (
            <FadeInView duration={400} delay={300}>
              <View style={styles.chartCard}>
                <Text style={styles.sectionTitle}>Répartition par thème</Text>
                <PieChart
                  data={pieChartData}
                  width={screenWidth - theme.spacing.lg * 2 - theme.spacing.md * 2}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            </FadeInView>
          )}

          {/* Comparaison des performances */}
          {themeStats.length > 0 && (
            <FadeInView duration={400} delay={400}>
              <View style={styles.chartCard}>
                <Text style={styles.sectionTitle}>Taux de réussite par thème</Text>
                <BarChart
                  data={barChartData}
                  width={screenWidth - theme.spacing.lg * 2 - theme.spacing.md * 2}
                  height={200}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  withInnerLines={false}
                  showBarTops={false}
                  yAxisSuffix="%"
                />
              </View>
            </FadeInView>
          )}

          {/* Heatmap d'activité */}
          <FadeInView duration={400} delay={500}>
            <View style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Activité des 90 derniers jours</Text>
              <ContributionGraph
                values={generateHeatmapData()}
                endDate={new Date()}
                numDays={90}
                width={screenWidth - theme.spacing.lg * 2 - theme.spacing.md * 2}
                height={200}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
                }}
                style={styles.chart}
                tooltipDataAttrs={() => ({})}
              />
            </View>
          </FadeInView>

          <View style={{ height: theme.spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: theme.spacing.xs,
  },
  objectivesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  objective: {
    marginBottom: theme.spacing.md,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  objectiveTitle: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  objectiveProgress: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.fontSize.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.sm,
  },
  periodButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
  },
  periodButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.fontSize.sm,
  },
  activePeriodButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  chart: {
    marginVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
});
