import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

class SoundService {
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;
  private soundObjects: { [key: string]: Audio.Sound | null } = {};

  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      // Configuration audio pour iOS et Android
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Charger les paramètres
      await this.loadSettings();

      console.info('Sound service initialized with haptic feedback');
    } catch (error) {
      console.error('Error initializing sound service:', error);
    }
  }

  async loadSettings() {
    try {
      const settings = await AsyncStorage.getItem('accessibility_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.soundEnabled = parsed.soundEnabled !== false;
        this.vibrationEnabled = parsed.vibrationEnabled !== false;
      }
    } catch (error) {
      console.error('Error loading sound settings:', error);
    }
  }

  // Générer un son synthétique avec expo-av
  private async playTone(frequency: number, duration: number = 200) {
    if (!this.soundEnabled) return;

    try {
      // Créer un son synthétique basique
      // Note: Expo AV ne supporte pas directement la génération de tons
      // On utilisera une approche différente avec des sons pré-enregistrés

      // Pour l'instant, on utilise uniquement le feedback haptique
      console.info(`Would play tone: ${frequency}Hz for ${duration}ms`);
    } catch (error) {
      console.error('Error playing tone:', error);
    }
  }

  async playCorrect() {
    if (this.soundEnabled) {
      // Jouer une séquence de notes ascendantes (Do-Mi-Sol)
      await this.playTone(523); // Do
      setTimeout(() => this.playTone(659), 100); // Mi
      setTimeout(() => this.playTone(784), 200); // Sol
    }

    if (this.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  async playIncorrect() {
    if (this.soundEnabled) {
      // Jouer une note descendante (Sol-Mi bémol)
      await this.playTone(392); // Sol
      setTimeout(() => this.playTone(311), 150); // Mi bémol
    }

    if (this.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  async playSkip() {
    if (this.soundEnabled) {
      // Jouer une note neutre (La)
      await this.playTone(440, 100);
    }

    if (this.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async playStreak() {
    if (this.soundEnabled) {
      // Jouer une fanfare courte (Do-Mi-Sol-Do octave)
      await this.playTone(523); // Do
      setTimeout(() => this.playTone(659), 100); // Mi
      setTimeout(() => this.playTone(784), 200); // Sol
      setTimeout(() => this.playTone(1047), 300); // Do octave
    }

    if (this.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 200);
    }
  }

  async playComplete() {
    if (this.soundEnabled) {
      // Jouer une mélodie de victoire
      const notes = [523, 587, 659, 784, 659, 784, 1047]; // Do-Ré-Mi-Sol-Mi-Sol-Do
      notes.forEach((freq, index) => {
        setTimeout(() => this.playTone(freq, 150), index * 150);
      });
    }

    if (this.vibrationEnabled) {
      // Pattern de vibration de victoire
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 100);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
    }
  }

  // Méthodes alternatives utilisant uniquement le feedback haptique
  async playSimpleCorrect() {
    if (this.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Log pour debug
    console.info('✅ Son: Bonne réponse');
  }

  async playSimpleIncorrect() {
    if (this.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    // Log pour debug
    console.info('❌ Son: Mauvaise réponse');
  }

  async playSimpleSkip() {
    if (this.vibrationEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Log pour debug
    console.info('⏭️ Son: Passer');
  }

  async playSimpleStreak() {
    if (this.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 200);
    }
    // Log pour debug
    console.info('🔥 Son: Streak!');
  }

  async playSimpleComplete() {
    if (this.vibrationEnabled) {
      // Pattern de vibration pour la fin
      const pattern = [
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
        () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
      ];

      pattern.forEach((vibrate, index) => {
        setTimeout(vibrate, index * 150);
      });
    }
    // Log pour debug
    console.info('🎉 Son: Session terminée!');
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    console.info(`Sons ${enabled ? 'activés' : 'désactivés'}`);
  }

  setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
    console.info(`Vibrations ${enabled ? 'activées' : 'désactivées'}`);
  }

  async cleanup() {
    // Nettoyer les sons chargés si nécessaire
    for (const sound of Object.values(this.soundObjects)) {
      if (sound) {
        try {
          await sound.unloadAsync();
        } catch (error) {
          console.error('Error unloading sound:', error);
        }
      }
    }
    this.soundObjects = {};
  }
}

export const soundService = new SoundService();
