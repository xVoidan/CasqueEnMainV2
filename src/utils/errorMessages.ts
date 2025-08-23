/**
 * Messages d'erreur contextuels et user-friendly
 */

/**
 * Helper pour afficher une alerte d'erreur contextuelle
 */
import { Alert } from 'react-native';

interface IErrorMessage {
  title: string;
  message: string;
  actions?: {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
  }[];
}

export const ErrorMessages: Record<string, ErrorMessage> = {
  // Erreurs de connexion
  NETWORK_ERROR: {
    title: 'Connexion impossible',
    message: 'Vérifiez votre connexion internet et réessayez.',
    actions: [
      { text: 'Réessayer', style: 'default' },
      { text: 'Mode hors ligne', style: 'cancel' },
    ],
  },

  TIMEOUT_ERROR: {
    title: 'Délai dépassé',
    message: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
    actions: [
      { text: 'Réessayer', style: 'default' },
      { text: 'Annuler', style: 'cancel' },
    ],
  },

  // Erreurs d'authentification
  INVALID_CREDENTIALS: {
    title: 'Identifiants incorrects',
    message: 'L\'email ou le mot de passe est incorrect. Veuillez réessayer.',
    actions: [
      { text: 'Réessayer', style: 'default' },
      { text: 'Mot de passe oublié ?', style: 'default' },
    ],
  },

  EMAIL_NOT_VERIFIED: {
    title: 'Email non vérifié',
    message: 'Veuillez vérifier votre email avant de vous connecter.',
    actions: [
      { text: 'Renvoyer l\'email', style: 'default' },
      { text: 'OK', style: 'cancel' },
    ],
  },

  ACCOUNT_LOCKED: {
    title: 'Compte bloqué',
    message: 'Votre compte a été temporairement bloqué après plusieurs tentatives échouées. Réessayez dans quelques minutes.',
    actions: [
      { text: 'OK', style: 'default' },
    ],
  },

  // Erreurs de validation
  WEAK_PASSWORD: {
    title: 'Mot de passe trop faible',
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.',
    actions: [
      { text: 'Compris', style: 'default' },
    ],
  },

  EMAIL_ALREADY_EXISTS: {
    title: 'Email déjà utilisé',
    message: 'Cet email est déjà associé à un compte. Connectez-vous ou utilisez un autre email.',
    actions: [
      { text: 'Se connecter', style: 'default' },
      { text: 'Utiliser un autre email', style: 'cancel' },
    ],
  },

  USERNAME_TAKEN: {
    title: 'Nom d\'utilisateur indisponible',
    message: 'Ce nom d\'utilisateur est déjà pris. Veuillez en choisir un autre.',
    actions: [
      { text: 'OK', style: 'default' },
    ],
  },

  // Erreurs de données
  NO_DATA: {
    title: 'Aucune donnée',
    message: 'Aucune donnée n\'est disponible pour le moment. Tirez pour rafraîchir.',
    actions: [
      { text: 'Rafraîchir', style: 'default' },
    ],
  },

  SAVE_ERROR: {
    title: 'Erreur de sauvegarde',
    message: 'Impossible de sauvegarder vos modifications. Veuillez réessayer.',
    actions: [
      { text: 'Réessayer', style: 'default' },
      { text: 'Annuler', style: 'cancel' },
    ],
  },

  LOAD_ERROR: {
    title: 'Erreur de chargement',
    message: 'Impossible de charger les données. Veuillez réessayer.',
    actions: [
      { text: 'Réessayer', style: 'default' },
      { text: 'Annuler', style: 'cancel' },
    ],
  },

  // Erreurs de permission
  CAMERA_PERMISSION_DENIED: {
    title: 'Accès à la caméra refusé',
    message: 'L\'application a besoin d\'accéder à votre caméra pour cette fonctionnalité.',
    actions: [
      { text: 'Ouvrir les paramètres', style: 'default' },
      { text: 'Annuler', style: 'cancel' },
    ],
  },

  STORAGE_PERMISSION_DENIED: {
    title: 'Accès au stockage refusé',
    message: 'L\'application a besoin d\'accéder à vos photos pour cette fonctionnalité.',
    actions: [
      { text: 'Ouvrir les paramètres', style: 'default' },
      { text: 'Annuler', style: 'cancel' },
    ],
  },

  NOTIFICATION_PERMISSION_DENIED: {
    title: 'Notifications désactivées',
    message: 'Activez les notifications pour recevoir des rappels et des mises à jour.',
    actions: [
      { text: 'Activer', style: 'default' },
      { text: 'Plus tard', style: 'cancel' },
    ],
  },

  // Erreurs de session
  SESSION_EXPIRED: {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    actions: [
      { text: 'Se reconnecter', style: 'default' },
    ],
  },

  CONCURRENT_SESSION: {
    title: 'Connexion sur un autre appareil',
    message: 'Votre compte est utilisé sur un autre appareil. Voulez-vous continuer ici ?',
    actions: [
      { text: 'Continuer ici', style: 'default' },
      { text: 'Annuler', style: 'cancel' },
    ],
  },

  // Erreurs de quota
  STORAGE_FULL: {
    title: 'Espace insuffisant',
    message: 'Il n\'y a plus assez d\'espace de stockage. Libérez de l\'espace et réessayez.',
    actions: [
      { text: 'OK', style: 'default' },
    ],
  },

  RATE_LIMIT: {
    title: 'Trop de tentatives',
    message: 'Vous avez effectué trop de tentatives. Veuillez patienter avant de réessayer.',
    actions: [
      { text: 'OK', style: 'default' },
    ],
  },

  // Erreur générique
  UNKNOWN_ERROR: {
    title: 'Une erreur est survenue',
    message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    actions: [
      { text: 'Réessayer', style: 'default' },
      { text: 'Annuler', style: 'cancel' },
    ],
  },
};

/**
 * Obtenir un message d'erreur contextuel basé sur le code d'erreur
 */
export const getErrorMessage = (errorCode: string | Error): IErrorMessage => {
  // Si c'est une Error, essayer d'extraire le code
  if (errorCode instanceof Error) {
    const message = errorCode.message.toLowerCase();

    // Mapper les messages d'erreur courants
    if (message.includes('network')) {return ErrorMessages.NETWORK_ERROR;}
    if (message.includes('timeout')) {return ErrorMessages.TIMEOUT_ERROR;}
    if (message.includes('invalid') && message.includes('credentials')) {return ErrorMessages.INVALID_CREDENTIALS;}
    if (message.includes('email') && message.includes('not') && message.includes('verified')) {return ErrorMessages.EMAIL_NOT_VERIFIED;}
    if (message.includes('weak') && message.includes('password')) {return ErrorMessages.WEAK_PASSWORD;}
    if (message.includes('email') && message.includes('exists')) {return ErrorMessages.EMAIL_ALREADY_EXISTS;}
    if (message.includes('username') && message.includes('taken')) {return ErrorMessages.USERNAME_TAKEN;}
    if (message.includes('permission') && message.includes('denied')) {
      if (message.includes('camera')) {return ErrorMessages.CAMERA_PERMISSION_DENIED;}
      if (message.includes('storage')) {return ErrorMessages.STORAGE_PERMISSION_DENIED;}
      if (message.includes('notification')) {return ErrorMessages.NOTIFICATION_PERMISSION_DENIED;}
    }
    if (message.includes('session') && message.includes('expired')) {return ErrorMessages.SESSION_EXPIRED;}
    if (message.includes('rate') && message.includes('limit')) {return ErrorMessages.RATE_LIMIT;}

    // Par défaut
    return ErrorMessages.UNKNOWN_ERROR;
  }

  // Si c'est une string, chercher directement
  if (typeof errorCode === 'string' && errorCode in ErrorMessages) {
    return ErrorMessages[errorCode];
  }

  // Erreur par défaut
  return ErrorMessages.UNKNOWN_ERROR;
};

export const showErrorAlert = (error: string | Error, customActions?: IErrorMessage['actions']): void => {
  const errorMessage = getErrorMessage(error);

  Alert.alert(
    errorMessage.title,
    errorMessage.message,
    customActions ?? errorMessage.actions?.map(action => ({
      text: action.text,
      style: action.style,
      onPress: action.onPress,
    })) || [{ text: 'OK' }],
  );
};
