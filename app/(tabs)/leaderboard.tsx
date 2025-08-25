import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/store/AuthContext';

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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.white,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  podiumItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
  },
  podiumRank: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: theme.spacing.xs,
  },
  podiumAvatarSecond: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  podiumName: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  podiumPoints: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  podiumBar: {
    width: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
  },
  leaderboardList: {
    marginTop: theme.spacing.lg,
  },
  rankCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentUserCard: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  rankNumber: {
    width: 30,
    alignItems: 'center',
  },
  rankText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  userPoints: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  periodBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    alignSelf: 'center',
  },
  periodBadgeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchButtonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: theme.colors.primary,
  },
});

interface LeaderboardUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  rank: number;
}

export default function LeaderboardScreen(): React.ReactElement {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'weekly' | 'monthly'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyFriends, setShowOnlyFriends] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('profiles')
        .select('user_id, username, avatar_url, total_points');

      // Filtrer selon la période sélectionnée
      if (activeTab === 'weekly') {
        // Points de la semaine en cours
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        // Pour l'instant, on utilise total_points mais idéalement
        // il faudrait une table user_stats avec des points par période
        query = query
          .select('user_id, username, avatar_url, total_points')
          .order('total_points', { ascending: false });
      } else if (activeTab === 'monthly') {
        // Points du mois en cours
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        query = query
          .select('user_id, username, avatar_url, total_points')
          .order('total_points', { ascending: false });
      } else {
        // Classement global
        query = query.order('total_points', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      const rankedData = data?.map((item, index) => ({
        ...item,
        rank: index + 1,
      })) || [];

      setLeaderboard(rankedData);
    } catch (error) {
      console.error('Erreur chargement classement:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const filteredLeaderboard = useMemo(() => {
    let filtered = [...leaderboard];

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.username.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // TODO: Filtrer par amis quand la fonctionnalité sera implémentée
    // if (showOnlyFriends) {
    //   filtered = filtered.filter(item => friendsList.includes(item.user_id));
    // }

    return filtered;
  }, [leaderboard, searchQuery, showOnlyFriends]);

  const renderPodium = () => {
    if (filteredLeaderboard.length < 3) return null;

    const podiumUsers = [filteredLeaderboard[1], filteredLeaderboard[0], filteredLeaderboard[2]];
    const heights = [100, 120, 80];
    const medals = ['🥈', '🥇', '🥉'];

    return (
      <View style={styles.podiumContainer}>
        {podiumUsers.map((user, index) => (
          <FadeInView key={user.user_id} duration={600} delay={index * 100}>
            <View style={styles.podiumItem}>
              <Text style={styles.podiumRank}>{medals[index]}</Text>
              {user.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={[
                    styles.podiumAvatar,
                    index !== 1 && styles.podiumAvatarSecond,
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.podiumAvatar,
                    index !== 1 && styles.podiumAvatarSecond,
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  ]}
                >
                  <Ionicons name="person" size={index === 1 ? 30 : 25} color={theme.colors.white} />
                </View>
              )}
              <LinearGradient
                colors={['rgba(220, 38, 38, 0.3)', 'rgba(220, 38, 38, 0.1)']}
                style={[styles.podiumBar, { height: heights[index] }]}
              >
                <Text style={styles.podiumName}>{user.username}</Text>
                <Text style={styles.podiumPoints}>{user.total_points.toLocaleString()} pts</Text>
              </LinearGradient>
            </View>
          </FadeInView>
        ))}
      </View>
    );
  };

  const getPeriodLabel = () => {
    switch (activeTab) {
      case 'weekly':
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
      case 'monthly':
        return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      default:
        return 'Tous les temps';
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Classement</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un joueur..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={[
              styles.searchButton,
              showOnlyFriends && styles.searchButtonActive,
            ]}
            onPress={() => setShowOnlyFriends(!showOnlyFriends)}
          >
            <Ionicons
              name={showOnlyFriends ? 'people' : 'people-outline'}
              size={20}
              color={showOnlyFriends ? theme.colors.primary : theme.colors.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'global' && styles.activeTab]}
            onPress={() => setActiveTab('global')}
          >
            <Text style={[styles.tabText, activeTab === 'global' && styles.activeTabText]}>
              Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'weekly' && styles.activeTab]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabText, activeTab === 'weekly' && styles.activeTabText]}>
              Semaine
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'monthly' && styles.activeTab]}
            onPress={() => setActiveTab('monthly')}
          >
            <Text style={[styles.tabText, activeTab === 'monthly' && styles.activeTabText]}>
              Mois
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {activeTab !== 'global' && (
            <View style={styles.periodBadge}>
              <Text style={styles.periodBadgeText}>{getPeriodLabel()}</Text>
            </View>
          )}

          {renderPodium()}

          <View style={styles.leaderboardList}>
            {filteredLeaderboard.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={60} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? 'Aucun joueur trouvé'
                    : activeTab === 'weekly'
                    ? 'Aucune donnée pour cette semaine'
                    : activeTab === 'monthly'
                    ? 'Aucune donnée pour ce mois'
                    : 'Aucun classement disponible'}
                </Text>
              </View>
            ) : (
              filteredLeaderboard.slice(3).map((item, index) => (
                <FadeInView key={item.user_id} duration={600} delay={index * 50}>
                  <View
                    style={[
                      styles.rankCard,
                      item.user_id === user?.id && styles.currentUserCard,
                    ]}
                  >
                    <View style={styles.rankNumber}>
                      <Text style={styles.rankText}>#{item.rank}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      {item.avatar_url ? (
                        <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.userAvatar}>
                          <Ionicons name="person" size={20} color={theme.colors.white} />
                        </View>
                      )}
                      <Text style={styles.userName}>{item.username}</Text>
                    </View>
                    <Text style={styles.userPoints}>
                      {item.total_points.toLocaleString()}
                      {activeTab !== 'global' && ' pts'}
                    </Text>
                  </View>
                </FadeInView>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
