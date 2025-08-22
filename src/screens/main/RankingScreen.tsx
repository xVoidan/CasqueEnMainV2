import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/store/AuthContext';
import { rankingService, IRankingEntry } from '@/src/services/rankingService';
import { GradeBadge } from '@/src/components/profile/GradeBadge';
import { GradientBackground } from '@/src/components/common/GradientBackground';
import { FadeInView } from '@/src/components/animations/FadeInView';
import { theme } from '@/src/styles/theme';

type TabType = 'global' | 'weekly' | 'monthly' | 'themes';

export const RankingScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [rankings, setRankings] = useState<IRankingEntry[]>([]);
  const [myPosition, setMyPosition] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('Mathématiques');

  const loadRankings = useCallback(async () => {
    try {
      const data = await rankingService.getRankings(user?.id);

      switch (activeTab) {
        case 'global':
          setRankings(data.global);
          setMyPosition(data.myPosition?.global || 0);
          break;
        case 'weekly':
          setRankings(data.weekly);
          setMyPosition(data.myPosition?.weekly || 0);
          break;
        case 'monthly':
          setRankings(data.monthly);
          setMyPosition(data.myPosition?.monthly || 0);
          break;
        case 'themes':
          setRankings(data.byTheme[selectedTheme] || []);
          break;
      }
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, selectedTheme, user?.id]);

  useEffect(() => {
    void loadRankings();
  }, [loadRankings]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadRankings();
  }, [loadRankings]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsLoading(true);
      const results = await rankingService.searchPlayer(searchQuery);
      setRankings(results);
      setIsLoading(false);
    } else {
      void loadRankings();
    }
  };

  const renderTab = (tab: TabType, label: string) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRankingItem = ({ item, index }: { item: IRankingEntry; index: number }) => {
    const isMe = item.user_id === user?.id;
    const isTop3 = item.rank <= 3;

    return (
      <FadeInView duration={300} delay={index * 50}>
        <TouchableOpacity
          style={[
            styles.rankingItem,
            isMe && styles.myRankingItem,
            isTop3 && styles.topRankingItem,
          ]}
          activeOpacity={0.8}
        >
          {isMe && (
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              style={StyleSheet.absoluteFillObject}
            />
          )}

          <View style={styles.rankContainer}>
            {isTop3 ? (
              <View style={[styles.topRankBadge, styles[`rank${item.rank}` as keyof typeof styles]]}>
                <Text style={styles.topRankText}>{item.rank}</Text>
              </View>
            ) : (
              <Text style={styles.rankText}>#{item.rank}</Text>
            )}

            {item.evolution !== undefined && item.evolution !== 0 && (
              <View style={styles.evolutionContainer}>
                <Ionicons
                  name={item.evolution > 0 ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={item.evolution > 0 ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.evolutionText,
                    { color: item.evolution > 0 ? '#10B981' : '#EF4444' },
                  ]}
                >
                  {Math.abs(item.evolution)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.playerInfo}>
            {item.avatar_url ? (
              <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={20} color={theme.colors.white} />
              </View>
            )}

            <View style={styles.playerDetails}>
              <Text style={[styles.username, isMe && styles.myUsername]}>
                {item.username}
                {isMe && ' (Vous)'}
              </Text>
              {item.department && (
                <Text style={styles.department}>{item.department}</Text>
              )}
            </View>
          </View>

          <View style={styles.rightSection}>
            <GradeBadge grade={item.grade} size="small" showName={false} />
            <Text style={styles.points}>{item.points.toLocaleString()} pts</Text>
          </View>
        </TouchableOpacity>
      </FadeInView>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Classement</Text>

          {myPosition > 0 && (
            <View style={styles.myPositionBadge}>
              <Text style={styles.myPositionText}>Ma position: #{myPosition}</Text>
            </View>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un joueur..."
            placeholderTextColor={theme.colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              void loadRankings();
            }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabs}>
          {renderTab('global', 'Global')}
          {renderTab('weekly', 'Hebdo')}
          {renderTab('monthly', 'Mensuel')}
          {renderTab('themes', 'Thèmes')}
        </View>

        {activeTab === 'themes' && (
          <View style={styles.themeSelector}>
            {['Mathématiques', 'Français', 'Métier'].map(theme => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.themeButton,
                  selectedTheme === theme && styles.selectedThemeButton,
                ]}
                onPress={() => setSelectedTheme(theme)}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    selectedTheme === theme && styles.selectedThemeButtonText,
                  ]}
                >
                  {theme}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={rankings}
            renderItem={renderRankingItem}
            keyExtractor={item => item.user_id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun classement disponible</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  myPositionBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  myPositionText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: theme.typography.fontSize.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
  },
  tabs: {
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
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.fontSize.base,
  },
  activeTabText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  themeSelector: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  themeButton: {
    flex: 1,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.sm,
  },
  selectedThemeButton: {
    backgroundColor: theme.colors.primary,
  },
  themeButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.fontSize.sm,
  },
  selectedThemeButtonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  myRankingItem: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    overflow: 'hidden',
  },
  topRankingItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    minWidth: 40,
  },
  rankText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
  },
  topRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank1: {
    backgroundColor: '#FFD700',
  },
  rank2: {
    backgroundColor: '#C0C0C0',
  },
  rank3: {
    backgroundColor: '#CD7F32',
  },
  topRankText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize.base,
  },
  evolutionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  evolutionText: {
    fontSize: theme.typography.fontSize.xs,
    marginLeft: 2,
  },
  playerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  playerDetails: {
    flex: 1,
  },
  username: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  myUsername: {
    color: theme.colors.primary,
  },
  department: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  points: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    marginTop: 4,
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
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: theme.typography.fontSize.base,
  },
});
