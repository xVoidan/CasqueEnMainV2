import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabase';

interface IGoogleAuthData {
  isGoogleAuth: boolean;
  googleUser?: {
    name: string;
    picture: string;
    verified_email: boolean;
  };
}

interface IAuthContext {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signIn: (email: string, password: string, googleData?: IGoogleAuthData) => Promise<void>;
  signUp: (email: string, password: string, username: string, department: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  continueAsGuest: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

const GUEST_SESSION_KEY = '@CasqueEnMains:guestSession';
const AUTH_SESSION_KEY = '@CasqueEnMains:authSession';

// Magic numbers constants
const INITIAL_GRADE = 1;
const INITIAL_POINTS = 0;
const INITIAL_STREAK = 0;

// Utility functions
const handleStorageOperations = {
  async setAuthSession(session: Session): Promise<void> {
    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
  },

  async setGuestSession(): Promise<void> {
    const guestSession = {
      id: 'guest',
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestSession));
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  },

  async clearAllSessions(): Promise<void> {
    await AsyncStorage.multiRemove([AUTH_SESSION_KEY, GUEST_SESSION_KEY]);
  },

  async removeAuthSession(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
  },
};

const createUserProfile = async (
  userId: string,
  username: string,
  department: string,
): Promise<void> => {
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      username,
      department,
      current_grade: INITIAL_GRADE,
      total_points: INITIAL_POINTS,
      streak_days: INITIAL_STREAK,
    })
    .eq('user_id', userId);

  if (profileError) {

  }
};

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const checkSession = async (): Promise<void> => {
    try {
      // Vérifier d'abord la session Supabase
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setIsGuest(false);
      } else {
        // Vérifier le mode invité
        const guestData = await AsyncStorage.getItem(GUEST_SESSION_KEY);
        if (guestData) {
          setIsGuest(true);
        }
      }
    } catch (_error) {

    } finally {
      setLoading(false);
    }
  };

  const handleAuthStateChange = (newSession: Session | null): void => {
    setSession(newSession);
    setUser(newSession?.user ?? null);

    if (newSession) {
      setIsGuest(false);
      void handleStorageOperations.setAuthSession(newSession);
    } else {
      void handleStorageOperations.removeAuthSession();
    }
  };

  // Vérifier la session au démarrage
  useEffect(() => {
    void checkSession();

    // Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      handleAuthStateChange(newSession);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGoogleAuth = async (
    email: string,
    password: string,
    googleData: IGoogleAuthData,
  ): Promise<void> => {
    // Vérifier d'abord si l'utilisateur existe
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (existingUser?.session) {
      // L'utilisateur existe déjà, connexion réussie
      setSession(existingUser.session);
      setUser(existingUser.user);
      setIsGuest(false);
      await handleStorageOperations.setAuthSession(existingUser.session);
      return;
    }

    // Si l'utilisateur n'existe pas, on le crée
    const { data: newUser, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: googleData.googleUser?.name,
          avatar_url: googleData.googleUser?.picture,
          provider: 'google',
          email_verified: googleData.googleUser?.verified_email,
        },
      },
    });

    if (signUpError) {
      throw signUpError;
    }

    if (newUser.session) {
      setSession(newUser.session);
      setUser(newUser.user);
      setIsGuest(false);
      await handleStorageOperations.setAuthSession(newUser.session);

      // Créer le profil avec les données Google
      if (newUser.user?.id) {
        await createUserProfile(
          newUser.user.id,
          googleData.googleUser?.name ?? email.split('@')[0],
          '', // Department vide pour les utilisateurs Google
        );
      }
    }
  };

  const signIn = async (
    email: string,
    password: string,
    googleData?: IGoogleAuthData,
  ): Promise<void> => {
    try {
      setLoading(true);

      // Si c'est une authentification Google, on gère différemment
      if (googleData?.isGoogleAuth) {
        await handleGoogleAuth(email, password, googleData);
      } else {
        // Connexion normale
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Gérer le cas spécifique de l'email non confirmé
          if (error.message === 'Email not confirmed') {
            const customError = new Error(
              "Votre adresse email n'est pas encore confirmée. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.",
            );
            (customError as any).code = 'EMAIL_NOT_CONFIRMED';
            (customError as any).email = email;
            throw customError;
          }

          // Traduire les autres erreurs courantes
          let errorMessage = '';

          if (error.message === 'Invalid login credentials') {
            errorMessage = '❌ Email ou mot de passe incorrect. Veuillez vérifier vos identifiants et réessayer.';
          } else if (error.message.includes('Invalid email')) {
            errorMessage = '📧 Format d\'email invalide. Veuillez entrer une adresse email valide.';
          } else if (error.message.includes('User not found')) {
            errorMessage = '🔍 Aucun compte trouvé avec cet email. Veuillez vous inscrire d\'abord.';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = '⏱️ Trop de tentatives de connexion. Veuillez patienter quelques instants avant de réessayer.';
          } else if (error.message.includes('Network')) {
            errorMessage = '📡 Problème de connexion réseau. Veuillez vérifier votre connexion internet.';
          } else {
            // Message par défaut pour les autres erreurs
            errorMessage = `⚠️ Erreur de connexion : ${error.message}`;
          }

          const customError = new Error(errorMessage);
          (customError as any).originalError = error;
          throw customError;
        }

        if (data.session !== null) {
          setSession(data.session);
          setUser(data.user);
          setIsGuest(false);
          await handleStorageOperations.setAuthSession(data.session);
        }
      }
    } catch (_error) {
      const authError = error as AuthError;
      throw new Error(authError.message ?? 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    department: string,
  ): Promise<void> => {
    try {
      setLoading(true);

      // Créer l'utilisateur
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            department,
          },
        },
      });

      if (error) {
        // Traduire les erreurs d'inscription
        let errorMessage = '';

        if (error.message === 'User already registered') {
          errorMessage = '📧 Un compte existe déjà avec cet email. Veuillez vous connecter.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = '🔒 Le mot de passe doit contenir au moins 6 caractères.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = '📧 Format d\'email invalide. Veuillez entrer une adresse email valide.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = '⏱️ Trop de tentatives. Veuillez patienter quelques instants avant de réessayer.';
        } else {
          errorMessage = `⚠️ Erreur d'inscription : ${error.message}`;
        }

        const customError = new Error(errorMessage);
        (customError as any).originalError = error;
        throw customError;
      }

      // Créer le profil
      if (data.user?.id !== undefined) {
        await createUserProfile(data.user.id, username, department);
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setIsGuest(false);
        await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(data.session));
      }
    } catch (_error) {
      const authError = error as AuthError;
      throw new Error(authError.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);

      if (!isGuest) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      }

      setUser(null);
      setSession(null);
      setIsGuest(false);
      await handleStorageOperations.clearAllSessions();
    } catch (_error) {

      throw new Error('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'casqueenmain://reset-password',
      });

      if (error) {
        throw error;
      }
    } catch (_error) {
      const authError = error as AuthError;
      throw new Error(authError.message || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async (): Promise<void> => {
    try {
      setLoading(true);
      setIsGuest(true);

      await handleStorageOperations.setGuestSession();
    } catch (_error) {

      throw new Error('Erreur lors du passage en mode invité');
    } finally {
      setLoading(false);
    }
  };

  const value: IAuthContext = {
    user,
    session,
    loading,
    isGuest,
    signIn,
    signUp,
    signOut,
    resetPassword,
    continueAsGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): IAuthContext {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
