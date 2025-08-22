import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FadeInView } from '../animations/FadeInView';
import { useHaptics } from '@/src/hooks/useHaptics';
import { theme } from '@/src/styles/theme';

const { width } = Dimensions.get('window');

interface IEmptyStateProps {
  icon?: string | React.ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
  };
  fullScreen?: boolean;
  animated?: boolean;
}

export const EmptyState: React.FC<IEmptyStateProps> = ({
  icon,
  iconName,
  title,
  subtitle,
  action,
  fullScreen = false,
  animated = true,
}) => {
  const haptics = useHaptics();
  
  const handleActionPress = () => {
    void haptics.tap();
    action?.onPress();
  };

  const content = (
    <View style={[styles.container, fullScreen && styles.fullScreenContainer]}>
      <View style={styles.content}>
        {/* Icône ou Emoji */}
        {icon && typeof icon === 'string' ? (
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>{icon}</Text>
          </View>
        ) : iconName ? (
          <View style={styles.iconContainer}>
            <Ionicons name={iconName} size={64} color={theme.colors.text.secondary} />
          </View>
        ) : icon ? (
          <View style={styles.customIconContainer}>{icon}</View>
        ) : null}

        {/* Titre */}
        <Text style={styles.title}>{title}</Text>

        {/* Sous-titre */}
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}

        {/* Action */}
        {action && (
          <TouchableOpacity
            onPress={handleActionPress}
            activeOpacity={0.8}
            style={styles.actionButton}
          >
            {action.variant === 'primary' ? (
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.actionTextPrimary}>{action.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.secondaryButton}>
                <Text style={styles.actionTextSecondary}>{action.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return animated ? (
    <FadeInView duration={600} delay={200}>
      {content}
    </FadeInView>
  ) : (
    content
  );
};

// Composants prédéfinis pour les cas courants
export const NoDataEmptyState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    icon="📊"
    title="Aucune donnée disponible"
    subtitle="Commencez à jouer pour voir vos statistiques"
    action={onRefresh ? {
      label: "Rafraîchir",
      onPress: onRefresh,
      variant: 'secondary'
    } : undefined}
  />
);

export const NoQuestionsEmptyState: React.FC<{ onAddQuestion?: () => void }> = ({ onAddQuestion }) => (
  <EmptyState
    icon="❓"
    title="Aucune question"
    subtitle="Il n'y a pas encore de questions dans cette catégorie"
    action={onAddQuestion ? {
      label: "Ajouter une question",
      onPress: onAddQuestion,
      variant: 'primary'
    } : undefined}
  />
);

export const NoConnectionEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    iconName="cloud-offline-outline"
    title="Pas de connexion"
    subtitle="Vérifiez votre connexion internet et réessayez"
    action={onRetry ? {
      label: "Réessayer",
      onPress: onRetry,
      variant: 'primary'
    } : undefined}
  />
);

export const SearchEmptyState: React.FC<{ query: string; onClear?: () => void }> = ({ query, onClear }) => (
  <EmptyState
    iconName="search-outline"
    title="Aucun résultat"
    subtitle={`Aucun résultat trouvé pour "${query}"`}
    action={onClear ? {
      label: "Effacer la recherche",
      onPress: onClear,
      variant: 'secondary'
    } : undefined}
  />
);

export const ErrorEmptyState: React.FC<{ error?: string; onRetry?: () => void }> = ({ error, onRetry }) => (
  <EmptyState
    iconName="alert-circle-outline"
    title="Une erreur est survenue"
    subtitle={error || "Quelque chose s'est mal passé. Veuillez réessayer."}
    action={onRetry ? {
      label: "Réessayer",
      onPress: onRetry,
      variant: 'primary'
    } : undefined}
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  fullScreenContainer: {
    minHeight: Dimensions.get('window').height * 0.5,
  },
  content: {
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  emojiContainer: {
    marginBottom: theme.spacing.xl,
  },
  emoji: {
    fontSize: 80,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
    opacity: 0.8,
  },
  customIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  actionButton: {
    marginTop: theme.spacing.md,
  },
  gradientButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl * 1.5,
    borderRadius: theme.borderRadius.full,
  },
  secondaryButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl * 1.5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionTextPrimary: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionTextSecondary: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
});