import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

class NotificationService {
  private sounds: { [key: string]: Audio.Sound | null } = {
    success: null,
    error: null,
    unlock: null,
    notification: null,
  };

  constructor() {
    this.loadSounds();
  }

  private async loadSounds(): Promise<void> {
    try {
      // Configurer le mode audio
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Charger les sons (vous devrez ajouter ces fichiers audio)
      // this.sounds.success = await this.loadSound(require('@/assets/sounds/success.mp3'));
      // this.sounds.error = await this.loadSound(require('@/assets/sounds/error.mp3'));
      // this.sounds.unlock = await this.loadSound(require('@/assets/sounds/unlock.mp3'));
      // this.sounds.notification = await this.loadSound(require('@/assets/sounds/notification.mp3'));
    } catch (_error) {

    }
  }

  private async loadSound(source: number): Promise<Audio.Sound | null> {
    try {
      const { sound } = await Audio.Sound.createAsync(source);
      return sound;
    } catch (_error) {

      return null;
    }
  }

  async playSound(type: 'success' | 'error' | 'unlock' | 'notification'): Promise<void> {
    try {
      const sound = this.sounds[type];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (_error) {

    }
  }

  async hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'): Promise<void> {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
        }
      } catch (_error) {

      }
    }
  }

  async showBadgeUnlock(_badgeName: string): Promise<void> {
    // Jouer le son d'unlock
    await this.playSound('unlock');

    // Vibration de succès
    await this.hapticFeedback('success');

    // L'animation confettis sera gérée par le composant UI
  }

  async showSuccess(): Promise<void> {
    await this.playSound('success');
    await this.hapticFeedback('success');
  }

  async showError(): Promise<void> {
    await this.playSound('error');
    await this.hapticFeedback('error');
  }

  async buttonPress(): Promise<void> {
    await this.hapticFeedback('light');
  }

  async cleanup(): Promise<void> {
    // Libérer les ressources audio
    for (const sound of Object.values(this.sounds)) {
      if (sound) {
        await sound.unloadAsync();
      }
    }
  }
}

export const notificationService = new NotificationService();
