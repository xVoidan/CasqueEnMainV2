// Performance optimized
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/styles/theme';

interface IProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface IState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): IState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {

    this.setState({
      error,
      errorInfo,
    });

    // Ici vous pouvez envoyer l'erreur à un service de monitoring
    // comme Sentry, Bugsnag, etc.
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

  return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="warning-outline" size={64} color={theme.colors.error} />
            </View>

            <Text style={styles.title}>Oops ! Une erreur est survenue</Text>
            <Text style={styles.subtitle}>
              L'application a rencontré un problème inattendu.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Détails de l'erreur :</Text>
                <Text style={styles.errorMessage}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <ScrollView style={styles.stackTrace}>
                    <Text style={styles.stackTraceText}>
                      {this.state.errorInfo.componentStack}
                    </Text>
                  </ScrollView>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                // Rediriger vers l'écran d'accueil
                this.handleReset();
              }}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Retour à l'accueil
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
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
  },
  errorDetails: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  errorTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: 'bold',
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  errorMessage: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  stackTrace: {
    maxHeight: 200,
    marginTop: theme.spacing.sm,
  },
  stackTraceText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
  },
});
