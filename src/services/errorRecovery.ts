import { Alert } from 'react-native';
import * as Linking from 'expo-linking';

interface IErrorContext {
  code: string;
  message: string;
  context?: string;
  timestamp: number;
  userId?: string;
}

interface IRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'primary' | 'secondary';
}

export class ErrorRecoveryService {
  private static errorHistory: IErrorContext[] = [];
  private static readonly MAX_ERROR_HISTORY = 50;

  /**
   * Handle error with context and recovery options
   */
  static async handleError(
    error: Error | unknown,
    context: string,
    userId?: string,
  ): Promise<void> {
    // Log error
    const err = error as Error & { code?: string };
    const errorContext: IErrorContext = {
      code: err.code ?? 'UNKNOWN',
      message: err.message ?? 'Une erreur est survenue',
      context,
      timestamp: Date.now(),
      userId,
    };

    this.addToHistory(errorContext);

    // Get recovery actions based on error type
    const recoveryActions = this.getRecoveryActions(errorContext);

    // Show error with recovery options
    this.showErrorWithRecovery(errorContext, recoveryActions);
  }

  /**
   * Get recovery actions based on error type
   */
  private static getRecoveryActions(error: IErrorContext): IRecoveryAction[] {
    const actions: IRecoveryAction[] = [];

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
      actions.push({
        label: 'Réessayer',
        action: () => {
          // Retry logic would be implemented in the calling component

        },
        type: 'primary',
      });
      actions.push({
        label: 'Mode hors ligne',
        action: () => {
          // Switch to offline mode

        },
        type: 'secondary',
      });
    }

    // Authentication errors
    if (error.code === 'AUTH_ERROR' || error.context?.includes('auth')) {
      actions.push({
        label: 'Se reconnecter',
        action: () => {
          // Navigate to login

        },
        type: 'primary',
      });
      actions.push({
        label: 'Mot de passe oublié',
        action: () => {
          // Navigate to password reset

        },
        type: 'secondary',
      });
    }

    // Validation errors
    if (error.code === 'VALIDATION_ERROR') {
      actions.push({
        label: 'Corriger',
        action: () => {
          // Focus on invalid field

        },
        type: 'primary',
      });
    }

    // Rate limit errors
    if (error.code === 'RATE_LIMIT' || error.message.includes('trop de tentatives')) {
      actions.push({
        label: 'Voir les limites',
        action: () => {
          Alert.alert(
            'Limites de sécurité',
            'Pour protéger votre compte, nous limitons le nombre de tentatives. Veuillez patienter avant de réessayer.',
          );
        },
        type: 'secondary',
      });
    }

    // Always add support option
    actions.push({
      label: 'Contacter le support',
      action: () => this.openSupport(error),
      type: 'secondary',
    });

    return actions;
  }

  /**
   * Show error with recovery options
   */
  private static showErrorWithRecovery(
    error: IErrorContext,
    actions: IRecoveryAction[],
  ): void {
    const buttons = actions.map((action) => ({
      text: action.label,
      onPress: action.action,
      style: action.type === 'primary' ? 'default' : ('cancel' as 'default' | 'cancel' | 'destructive'),
    }));

    Alert.alert(
      this.getErrorTitle(error),
      this.getErrorMessage(error),
      buttons,
      { cancelable: true },
    );
  }

  /**
   * Get user-friendly error title
   */
  private static getErrorTitle(error: IErrorContext): string {
    const titles: Record<string, string> = {
      NETWORK_ERROR: 'Problème de connexion',
      AUTH_ERROR: 'Erreur d\'authentification',
      VALIDATION_ERROR: 'Données invalides',
      RATE_LIMIT: 'Trop de tentatives',
      SERVER_ERROR: 'Erreur serveur',
      NOT_FOUND: 'Introuvable',
      PERMISSION_DENIED: 'Accès refusé',
    };

    return titles[error.code] || 'Oops !';
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: IErrorContext): string {
    const messages: Record<string, string> = {
      NETWORK_ERROR: 'Vérifiez votre connexion internet et réessayez.',
      AUTH_ERROR: 'Vos identifiants semblent incorrects. Veuillez réessayer.',
      VALIDATION_ERROR: 'Certaines informations sont incorrectes. Veuillez les vérifier.',
      RATE_LIMIT: 'Vous avez fait trop de tentatives. Veuillez patienter quelques minutes.',
      SERVER_ERROR: 'Nos serveurs rencontrent des difficultés. Veuillez réessayer plus tard.',
      NOT_FOUND: 'La ressource demandée n\'existe pas ou a été déplacée.',
      PERMISSION_DENIED: 'Vous n\'avez pas les droits nécessaires pour cette action.',
    };

    // Check for specific error messages
    if (error.message.includes('email')) {
      return 'L\'adresse email semble incorrecte. Veuillez vérifier sa syntaxe.';
    }
    if (error.message.includes('password')) {
      return 'Le mot de passe ne respecte pas les critères de sécurité.';
    }
    if (error.message.includes('username')) {
      return 'Le nom d\'utilisateur est invalide ou déjà pris.';
    }

    return messages[error.code] || error.message || 'Une erreur inattendue s\'est produite.';
  }

  /**
   * Open support with error details
   */
  private static async openSupport(error: IErrorContext): Promise<void> {
    const subject = `Support - Erreur ${error.code}`;
    const body = `
Bonjour,

J'ai rencontré une erreur dans l'application :

Code d'erreur : ${error.code}
Message : ${error.message}
Contexte : ${error.context}
Date : ${new Date(error.timestamp).toLocaleString()}
ID Utilisateur : ${error.userId ?? 'Non connecté'}

Pouvez-vous m'aider ?

Cordialement,
    `.trim();

    const mailtoUrl = `mailto:support@casqueenmain.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailtoUrl);
    } catch {
      Alert.alert(
        'Support',
        `Email : support@casqueenmain.fr\n\nCode erreur : ${error.code}`,
      );
    }
  }

  /**
   * Add error to history
   */
  private static addToHistory(error: IErrorContext): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory.pop();
    }
  }

  /**
   * Get error history for debugging
   */
  static getErrorHistory(): IErrorContext[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  static clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get FAQ link for common errors
   */
  static getFAQLink(errorCode: string): string | null {
    const faqLinks: Record<string, string> = {
      AUTH_ERROR: 'https://casqueenmain.fr/faq#connexion',
      NETWORK_ERROR: 'https://casqueenmain.fr/faq#reseau',
      VALIDATION_ERROR: 'https://casqueenmain.fr/faq#formulaire',
      RATE_LIMIT: 'https://casqueenmain.fr/faq#securite',
    };

    return faqLinks[errorCode] || null;
  }
}
