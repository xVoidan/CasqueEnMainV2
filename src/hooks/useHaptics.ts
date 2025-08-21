import * as Haptics from 'expo-haptics';

type NotificationType = 'success' | 'warning' | 'error';
type ImpactStyle = 'light' | 'medium' | 'heavy';

interface IHapticsFunctions {
  impact: (style?: ImpactStyle) => void;
  notification: (type?: NotificationType) => void;
  selection: () => void;
}

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
  const impact = (style: ImpactStyle = 'light'): void => {
    void Haptics.impactAsync(impactStyleMap[style]);
  };

  const notification = (type: NotificationType = 'success'): void => {
    void Haptics.notificationAsync(notificationTypeMap[type]);
  };

  const selection = (): void => {
    void Haptics.selectionAsync();
  };

  return {
    impact,
    notification,
    selection,
  };
};
