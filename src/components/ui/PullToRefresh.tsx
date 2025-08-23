import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ScrollViewProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '@/src/hooks/useHaptics';
import { theme } from '@/src/styles/theme';

// Version pour FlatList
import { FlatList, FlatListProps } from 'react-native';

interface IPullToRefreshProps extends ScrollViewProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
  showLastUpdate?: boolean;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
  tintColor?: string;
  colors?: string[];
  progressBackgroundColor?: string;
}

export const PullToRefresh: React.FC<IPullToRefreshProps> = ({
  onRefresh,
  children,
  showLastUpdate = true,
  emptyState,
  isEmpty = false,
  tintColor = theme.colors.primary,
  colors = [theme.colors.primary, theme.colors.secondary],
  progressBackgroundColor = theme.colors.background,
  ...scrollViewProps
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const haptics = useHaptics();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.tap();

    try {
      const result = onRefresh();
      if (result instanceof Promise) {
        await result;
      }
      setLastUpdate(new Date());
      void haptics.notification('success');
    } catch (_error) {
      void haptics.notification('error');
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, haptics]);

  const formatLastUpdate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {return "À l'instant";}
    if (minutes < 60) {return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;}
    if (hours < 24) {return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;}
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  };

  return (
    <ScrollView
      {...scrollViewProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tintColor}
          colors={colors}
          progressBackgroundColor={progressBackgroundColor}
          title="Tirer pour rafraîchir"
          titleColor={theme.colors.text.secondary}
        />
      }
      contentContainerStyle={[
        scrollViewProps.contentContainerStyle,
        isEmpty && styles.emptyContainer,
      ]}
    >
      {showLastUpdate && !isEmpty && (
        <View style={styles.lastUpdateContainer}>
          <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
          <Text style={styles.lastUpdateText}>
            Dernière mise à jour : {formatLastUpdate(lastUpdate)}
          </Text>
        </View>
      )}

      {isEmpty && emptyState ? emptyState : children}
    </ScrollView>
  );
};

export function PullToRefreshFlatList<T>({
  onRefresh,
  showLastUpdate = true,
  tintColor = theme.colors.primary,
  colors = [theme.colors.primary, theme.colors.secondary],
  progressBackgroundColor = theme.colors.background,
  ...flatListProps
}: FlatListProps<T> & {
  onRefresh: () => Promise<void> | void;
  showLastUpdate?: boolean;
  tintColor?: string;
  colors?: string[];
  progressBackgroundColor?: string;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const haptics = useHaptics();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    void haptics.tap();

    try {
      const result = onRefresh();
      if (result instanceof Promise) {
        await result;
      }
      setLastUpdate(new Date());
      void haptics.notification('success');
    } catch (_error) {
      void haptics.notification('error');
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, haptics]);

  const formatLastUpdate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {return "À l'instant";}
    if (minutes < 60) {return `Mis à jour il y a ${minutes}min`;}
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {return `Mis à jour il y a ${hours}h`;}
    const days = Math.floor(hours / 24);
    return `Mis à jour il y a ${days}j`;
  };

  const ListHeaderComponent = showLastUpdate ? (
    <View style={styles.lastUpdateContainer}>
      <Ionicons name="refresh-outline" size={14} color={theme.colors.text.secondary} />
      <Text style={styles.lastUpdateText}>
        {formatLastUpdate(lastUpdate)}
      </Text>
    </View>
  ) : null;

  return (
    <FlatList
      {...flatListProps}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tintColor}
          colors={colors}
          progressBackgroundColor={progressBackgroundColor}
        />
      }
      ListHeaderComponent={
        <>
          {ListHeaderComponent}
          {flatListProps.ListHeaderComponent}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flexGrow: 1,
  },
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastUpdateText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
});
