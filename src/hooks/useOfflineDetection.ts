/**
 * Hook pour détecter si l'application est en mode hors ligne
 * et fournir des fonctionnalités pour gérer cet état
 */

import { useState, useEffect, useCallback } from 'react';

interface OfflineDetectionResult {
  isOffline: boolean;
  lastOnlineAt: Date | null;
  checkConnection: () => Promise<boolean>;
}

/**
 * Hook pour détecter si l'application est en mode hors ligne
 * @returns Un objet contenant l'état de la connexion et des fonctions utilitaires
 */
export function useOfflineDetection(): OfflineDetectionResult {
  // Forcer le mode en ligne (désactiver la détection hors ligne)
  const isNavigatorAvailable = typeof navigator !== 'undefined';
  // Toujours considérer l'application comme en ligne
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(new Date());

  // Fonction pour vérifier la connexion à Appwrite
  const checkAppwriteConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Vérifier si l'API Appwrite est accessible
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '';
      const response = await fetch(`${endpoint}/health/network`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Court timeout pour éviter d'attendre trop longtemps
        signal: AbortSignal.timeout(3000),
      });

      return response.ok;
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion à Appwrite:', error);
      return false;
    }
  }, []);

  // Fonction pour vérifier la connexion internet et à Appwrite
  // Modifiée pour toujours retourner true (mode en ligne forcé)
  const checkConnection = useCallback(async (): Promise<boolean> => {
    // Toujours considérer la connexion comme disponible
    setIsOffline(false);
    setLastOnlineAt(new Date());
    return true;
  }, [checkAppwriteConnection]);

  useEffect(() => {
    // Vérifier si window est disponible (côté client uniquement)
    if (typeof window === 'undefined') {
      return;
    }
    
    // Gestionnaires d'événements modifiés pour ignorer les changements de connexion
    const handleOnline = () => {
      // Ne rien faire, on reste toujours en ligne
      console.log('Événement online ignoré - Mode hors ligne désactivé');
    };

    const handleOffline = () => {
      // Ne rien faire, on reste toujours en ligne
      console.log('Événement offline ignoré - Mode hors ligne désactivé');
    };

    // Ajouter les écouteurs d'événements
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Vérifier la connexion au démarrage
    checkConnection();

    // Vérification périodique désactivée
    // const intervalId = setInterval(() => {
    //   checkConnection();
    // }, 30000);
    const intervalId = null;

    // Nettoyer les écouteurs d'événements et l'intervalle
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Vérifier si intervalId existe avant d'appeler clearInterval
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [checkConnection]);

  return {
    isOffline,
    lastOnlineAt,
    checkConnection,
  };
}