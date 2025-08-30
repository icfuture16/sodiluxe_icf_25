/**
 * Provider pour gérer l'état de connexion de l'application
 * Mode hors ligne désactivé - ce provider retourne toujours isOffline=false
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';

// Définir le type pour le contexte
interface OfflineContextType {
  isOffline: boolean;
  lastOnlineAt: Date | null;
  checkConnection: () => Promise<boolean>;
}

// Créer le contexte
const OfflineContext = createContext<OfflineContextType | null>(null);

// Hook pour utiliser le contexte
export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline doit être utilisé à l\'intérieur d\'un OfflineProvider');
  }
  return context;
};

// Props pour le provider
interface OfflineProviderProps {
  children: ReactNode;
}

/**
 * Provider pour gérer l'état de connexion de l'application
 * @param children Les composants enfants
 */
export function OfflineProvider({ children }: OfflineProviderProps) {
  // Mode hors ligne désactivé - toujours retourner isOffline=false
  const offlineState = {
    isOffline: false,
    lastOnlineAt: new Date(),
    checkConnection: async () => true
  };

  return (
    <OfflineContext.Provider value={offlineState}>
      {children}
      {/* Indicateur de mode hors ligne désactivé */}
    </OfflineContext.Provider>
  );
}