import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { sessionServiceV3 as sessionService } from '@/src/services/sessionServiceV3';
import { useAuth } from '@/src/store/AuthContext';

/**
 * Hook pour synchroniser automatiquement les sessions avec Supabase
 * quand la connexion réseau est rétablie
 */
export function useSessionSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Écouter les changements de connexion réseau
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('[useSessionSync] Connexion réseau détectée, tentative de sync...');

        // Retry les opérations échouées
        sessionService.retryFailedOperations()
          .then(() => {
            console.log('[useSessionSync] Synchronisation terminée');
          })
          .catch(error => {
            console.error('[useSessionSync] Erreur sync:', error);
          });
      }
    });

    // Vérifier immédiatement l'état de la connexion
    NetInfo.fetch().then(state => {
      if (state.isConnected && state.isInternetReachable) {
        sessionService.retryFailedOperations().catch(console.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Fonction pour forcer une synchronisation manuelle
  const forceSync = async () => {
    try {
      console.log('[useSessionSync] Synchronisation manuelle déclenchée');
      await sessionService.retryFailedOperations();
      console.log('[useSessionSync] Synchronisation manuelle terminée');
    } catch (error) {
      console.error('[useSessionSync] Erreur sync manuelle:', error);
      throw error;
    }
  };

  return { forceSync };
}
