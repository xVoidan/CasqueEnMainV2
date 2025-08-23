import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type NotificationType = 'success' | 'warning' | 'error';
type ImpactStyle = 'light' | 'medium' | 'heavy';
type PatternType = 'double' | 'triple' | 'long';

interface IHapticsFunctions {
  // Fonctions de base
  impact: (style?: ImpactStyle) => Promise<void>;
  notification: (type?: NotificationType) => Promise<void>;
  selection: () => Promise<void>;

  // Alias pratiques
  tap: () => Promise<void>;
  press: () => Promise<void>;
  longPress: () => Promise<void>;
  toggle: () => Promise<void>;

  // Patterns spéciaux
  pattern: (type: PatternType) => Promise<void>;

  // Configuration
  setEnabled: (enabled: boolean) => Promise<void>;
  isEnabled: boolean;
}

const HAPTICS_ENABLED_KEY = 'haptics_enabled';

const notificationTypeMap: Record<NotificationType, Haptics.NotificationFeedbackType> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

const impactStyleMap: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

export const useHaptics = (): IHapticsFunctions => {
  const [isEnabled, setIsEnabled] = useState(true);

  // Charger les préférences au montage
  useEffect(() => {
    const loadPreference = async () => {
      if (Platform.OS === 'web') {
        setIsEnabled(false);
        return;
      }

      try {
        const enabled = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
        setIsEnabled(enabled !== 'false'); // Activé par défaut
      } catch {
        setIsEnabled(true);
      }
    };
    void loadPreference();
  }, []);

  const impact = useCallback(async (style: ImpactStyle = 'light'): Promise<void> => {
    if (isEnabled && Platform.OS !== 'web') {
      await Haptics.impactAsync(impactStyleMap[style]);
    }
  }, [isEnabled]);

  const notification = useCallback(async (type: NotificationType = 'success'): Promise<void> => {
    if (isEnabled && Platform.OS !== 'web') {
      await Haptics.notificationAsync(notificationTypeMap[type]);
    }
  }, [isEnabled]);

  const selection = useCallback(async (): Promise<void> => {
    if (isEnabled && Platform.OS !== 'web') {
      await Haptics.selectionAsync();
    }
  }, [isEnabled]);

  const pattern = useCallback(async (type: PatternType): Promise<void> => {
    if (!isEnabled || Platform.OS === 'web') {return;}

    switch (type) {
      case 'double':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise(resolve => setTimeout(resolve, 100));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'triple':
        for (let i = 0; i < 3; i++) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (i < 2) {await new Promise(resolve => setTimeout(resolve, 100));}
        }
        break;
      case 'long':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  }, [isEnabled]);

  const setEnabledPref = useCallback(async (enabled: boolean): Promise<void> => {
    setIsEnabled(enabled);
    await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, enabled.toString());
  }, []);

  return {
    // Fonctions de base
    impact,
    notification,
    selection,

    // Alias pratiques
    tap: useCallback(() => impact('light'), [impact]),
    press: useCallback(() => impact('medium'), [impact]),
    longPress: useCallback(() => impact('heavy'), [impact]),
    toggle: selection,

    // Patterns spéciaux
    pattern,

    // Configuration
    setEnabled: setEnabledPref,
    isEnabled,
  };
};
