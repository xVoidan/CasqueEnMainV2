/**
 * Utilitaires pour améliorer l'accessibilité de l'application
 */

import { Platform, AccessibilityInfo } from 'react-native';

/**
 * Labels d'accessibilité pour les éléments interactifs
 */
export const A11yLabels = {
  // Navigation
  BACK_BUTTON: 'Retour',
  MENU_BUTTON: 'Ouvrir le menu',
  CLOSE_BUTTON: 'Fermer',
  SETTINGS_BUTTON: 'Paramètres',
  PROFILE_BUTTON: 'Profil',
  HOME_BUTTON: 'Accueil',
  
  // Actions communes
  SUBMIT_BUTTON: 'Valider',
  CANCEL_BUTTON: 'Annuler',
  SAVE_BUTTON: 'Enregistrer',
  DELETE_BUTTON: 'Supprimer',
  EDIT_BUTTON: 'Modifier',
  SHARE_BUTTON: 'Partager',
  REFRESH_BUTTON: 'Rafraîchir',
  SEARCH_BUTTON: 'Rechercher',
  FILTER_BUTTON: 'Filtrer',
  SORT_BUTTON: 'Trier',
  
  // Auth
  LOGIN_BUTTON: 'Se connecter',
  LOGOUT_BUTTON: 'Se déconnecter',
  REGISTER_BUTTON: "S'inscrire",
  FORGOT_PASSWORD_BUTTON: 'Mot de passe oublié',
  
  // Quiz
  START_QUIZ_BUTTON: 'Commencer le quiz',
  NEXT_QUESTION_BUTTON: 'Question suivante',
  PREVIOUS_QUESTION_BUTTON: 'Question précédente',
  SUBMIT_ANSWER_BUTTON: 'Valider la réponse',
  SKIP_QUESTION_BUTTON: 'Passer la question',
  
  // Media
  PLAY_BUTTON: 'Lecture',
  PAUSE_BUTTON: 'Pause',
  STOP_BUTTON: 'Arrêter',
  MUTE_BUTTON: 'Couper le son',
  UNMUTE_BUTTON: 'Activer le son',
  
  // States
  LOADING: 'Chargement en cours',
  ERROR: 'Erreur',
  SUCCESS: 'Succès',
  WARNING: 'Attention',
  INFO: 'Information',
};

/**
 * Hints d'accessibilité pour guider l'utilisateur
 */
export const A11yHints = {
  DOUBLE_TAP_TO_ACTIVATE: 'Double-tapez pour activer',
  SWIPE_TO_DISMISS: 'Glissez pour fermer',
  LONG_PRESS_FOR_OPTIONS: 'Appui long pour plus d\'options',
  PULL_TO_REFRESH: 'Tirez vers le bas pour rafraîchir',
  TAP_TO_EXPAND: 'Tapez pour développer',
  TAP_TO_COLLAPSE: 'Tapez pour réduire',
  SWIPE_LEFT_TO_DELETE: 'Glissez vers la gauche pour supprimer',
  SWIPE_RIGHT_TO_ARCHIVE: 'Glissez vers la droite pour archiver',
};

/**
 * Rôles d'accessibilité
 */
export const A11yRoles = {
  BUTTON: 'button' as const,
  LINK: 'link' as const,
  HEADER: 'header' as const,
  IMAGE: 'image' as const,
  IMAGEBUTTON: 'imagebutton' as const,
  TEXT: 'text' as const,
  ADJUSTABLE: 'adjustable' as const,
  SUMMARY: 'summary' as const,
  TIMER: 'timer' as const,
  PROGRESSBAR: 'progressbar' as const,
  SCROLLBAR: 'scrollbar' as const,
  TAB: 'tab' as const,
  TABLIST: 'tablist' as const,
  ALERT: 'alert' as const,
  CHECKBOX: 'checkbox' as const,
  RADIO: 'radio' as const,
  SEARCH: 'search' as const,
  MENU: 'menu' as const,
  MENUITEM: 'menuitem' as const,
  TOOLBAR: 'toolbar' as const,
  NONE: 'none' as const,
};

/**
 * Helper pour créer des props d'accessibilité complètes
 */
export const createA11yProps = (options: {
  label: string;
  hint?: string;
  role?: keyof typeof A11yRoles;
  value?: string | { text?: string; min?: number; max?: number; now?: number };
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  liveRegion?: 'none' | 'polite' | 'assertive';
  important?: boolean;
}) => {
  const props: any = {
    accessible: true,
    accessibilityLabel: options.label,
  };

  if (options.hint) {
    props.accessibilityHint = options.hint;
  }

  if (options.role) {
    props.accessibilityRole = A11yRoles[options.role];
  }

  if (options.value) {
    props.accessibilityValue = options.value;
  }

  if (options.state) {
    props.accessibilityState = options.state;
  }

  if (options.liveRegion) {
    props.accessibilityLiveRegion = options.liveRegion;
  }

  if (options.important !== undefined) {
    props.importantForAccessibility = options.important ? 'yes' : 'no';
  }

  return props;
};

/**
 * Hook pour gérer l'état du lecteur d'écran
 */
import { useEffect, useState } from 'react';

export const useScreenReader = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsEnabled(enabled);
    };

    checkScreenReader();

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsEnabled
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  const announce = (message: string, delay = 0) => {
    setTimeout(() => {
      AccessibilityInfo.announceForAccessibility(message);
    }, delay);
  };

  const focusElement = (element: any) => {
    if (Platform.OS === 'ios') {
      AccessibilityInfo.setAccessibilityFocus(element);
    }
  };

  return {
    isScreenReaderEnabled: isEnabled,
    announce,
    focusElement,
  };
};

/**
 * Helper pour les tailles minimales de touch targets
 */
export const TouchTargetSizes = {
  MINIMUM: 44, // Minimum recommandé par Apple
  COMFORTABLE: 48, // Confortable pour la plupart des utilisateurs
  LARGE: 56, // Pour une meilleure accessibilité
  EXTRA_LARGE: 64, // Pour les utilisateurs avec difficultés motrices
};

/**
 * Helper pour les contrastes de couleurs
 */
export const checkColorContrast = (
  foreground: string,
  background: string
): { ratio: number; passes: { AA: boolean; AAA: boolean } } => {
  // Convertir hex en RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Calculer la luminance relative
  const getLuminance = (rgb: { r: number; g: number; b: number }) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) {
    return { ratio: 0, passes: { AA: false, AAA: false } };
  }

  const fgLuminance = getLuminance(fgRgb);
  const bgLuminance = getLuminance(bgRgb);

  const ratio =
    (Math.max(fgLuminance, bgLuminance) + 0.05) /
    (Math.min(fgLuminance, bgLuminance) + 0.05);

  return {
    ratio,
    passes: {
      AA: ratio >= 4.5, // WCAG AA
      AAA: ratio >= 7, // WCAG AAA
    },
  };
};

/**
 * Helper pour générer des descriptions d'images
 */
export const generateImageDescription = (context: {
  type: 'decorative' | 'informative' | 'functional';
  content?: string;
  action?: string;
}) => {
  if (context.type === 'decorative') {
    return ''; // Les images décoratives ne nécessitent pas de description
  }

  if (context.type === 'functional' && context.action) {
    return context.action;
  }

  return context.content || 'Image';
};

/**
 * Helper pour formater le temps pour les lecteurs d'écran
 */
export const formatTimeForScreenReader = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} seconde${secs > 1 ? 's' : ''}`);

  return parts.join(' et ');
};

/**
 * Helper pour formater les pourcentages pour les lecteurs d'écran
 */
export const formatPercentageForScreenReader = (value: number, total: number): string => {
  const percentage = Math.round((value / total) * 100);
  return `${value} sur ${total}, soit ${percentage} pour cent`;
};