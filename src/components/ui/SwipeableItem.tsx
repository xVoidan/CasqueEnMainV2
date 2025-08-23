import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useHaptics } from '@/src/hooks/useHaptics';
import { theme } from '@/src/styles/theme';

interface SwipeAction {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  color: string;
  backgroundColor: string;
  onPress: () => void | Promise<void>;
  hapticType?: 'light' | 'medium' | 'heavy';
}

interface ISwipeableItemProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  overshootLeft?: boolean;
  overshootRight?: boolean;
  closeOnAction?: boolean;
  friction?: number;
  leftThreshold?: number;
  rightThreshold?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export const SwipeableItem: React.FC<ISwipeableItemProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  overshootLeft = false,
  overshootRight = false,
  closeOnAction = true,
  friction = 2,
  leftThreshold = 30,
  rightThreshold = 30,
  onSwipeStart,
  onSwipeEnd,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const haptics = useHaptics();

  const handleActionPress = async (action: SwipeAction) => {
    // Haptic feedback
    switch (action.hapticType) {
      case 'heavy':
        await haptics.longPress();
        break;
      case 'medium':
        await haptics.press();
        break;
      default:
        await haptics.tap();
    }

    // Execute action
    await action.onPress();

    // Close swipeable if needed
    if (closeOnAction) {
      swipeableRef.current?.close();
    }
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    if (leftActions.length === 0) {return null;}

    return (
      <View style={styles.actionsContainer}>
        {leftActions.map((action, index) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-100, 0],
          });

          const scale = progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.8, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor,
                  transform: [{ translateX: trans }, { scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionTouchable}
                onPress={() => handleActionPress(action)}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                {action.label && (
                  <Text style={[styles.actionLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    if (rightActions.length === 0) {return null;}

    return (
      <View style={[styles.actionsContainer, styles.rightActionsContainer]}>
        {rightActions.map((action, index) => {
          const trans = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 0],
          });

          const scale = progress.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.8, 1],
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.backgroundColor,
                  transform: [{ translateX: trans }, { scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionTouchable}
                onPress={() => handleActionPress(action)}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
                {action.label && (
                  <Text style={[styles.actionLabel, { color: action.color }]}>
                    {action.label}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={friction}
      leftThreshold={leftThreshold}
      rightThreshold={rightThreshold}
      overshootLeft={overshootLeft}
      overshootRight={overshootRight}
      renderLeftActions={leftActions.length > 0 ? renderLeftActions : undefined}
      renderRightActions={rightActions.length > 0 ? renderRightActions : undefined}
      onSwipeableWillOpen={onSwipeStart}
      onSwipeableWillClose={onSwipeEnd}
    >
      {children}
    </Swipeable>
  );
};

SwipeableItem.displayName = 'SwipeableItem';

// Composants prédéfinis pour les actions courantes
export const DeleteSwipeAction: SwipeAction = {
  icon: 'trash-outline',
  label: 'Supprimer',
  color: theme.colors.white,
  backgroundColor: theme.colors.error,
  onPress: () => {},
  hapticType: 'heavy',
};

export const ArchiveSwipeAction: SwipeAction = {
  icon: 'archive-outline',
  label: 'Archiver',
  color: theme.colors.white,
  backgroundColor: theme.colors.warning,
  onPress: () => {},
  hapticType: 'medium',
};

export const FavoriteSwipeAction: SwipeAction = {
  icon: 'heart-outline',
  label: 'Favori',
  color: theme.colors.white,
  backgroundColor: theme.colors.primary,
  onPress: () => {},
  hapticType: 'light',
};

export const ShareSwipeAction: SwipeAction = {
  icon: 'share-outline',
  label: 'Partager',
  color: theme.colors.white,
  backgroundColor: theme.colors.info,
  onPress: () => {},
  hapticType: 'light',
};

export const EditSwipeAction: SwipeAction = {
  icon: 'create-outline',
  label: 'Modifier',
  color: theme.colors.white,
  backgroundColor: theme.colors.success,
  onPress: () => {},
  hapticType: 'light',
};

// Composant SwipeableListItem avec style prédéfini
interface ISwipeableListItemProps extends ISwipeableItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

export const SwipeableListItem: React.FC<ISwipeableListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  ...swipeProps
}) => {
  const haptics = useHaptics();

  const handlePress = async () => {
    await haptics.tap();
    onPress?.();
  };

  return (
    <SwipeableItem {...swipeProps}>
      <TouchableOpacity
        style={styles.listItem}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {leftIcon && (
          <View style={styles.listItemIcon}>
            <Ionicons name={leftIcon} size={24} color={theme.colors.text.secondary} />
          </View>
        )}

        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.listItemSubtitle}>{subtitle}</Text>
          )}
        </View>

        {rightIcon && (
          <View style={styles.listItemIcon}>
            <Ionicons name={rightIcon} size={20} color={theme.colors.text.secondary} />
          </View>
        )}
      </TouchableOpacity>
    </SwipeableItem>
  );
};

SwipeableListItem.displayName = 'SwipeableListItem';

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightActionsContainer: {
    justifyContent: 'flex-end',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 75,
    height: '100%',
  },
  actionTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  actionLabel: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listItemIcon: {
    marginRight: theme.spacing.md,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  listItemSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
