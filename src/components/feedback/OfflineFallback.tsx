import React, { ReactNode } from 'react';
import { AppwriteConnectionError } from './AppwriteConnectionError';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOffline } from '@/providers/OfflineProvider';

interface OfflineFallbackProps {
  /** Contenu à afficher lorsque l'application est en ligne */
  children: ReactNode;
  /** Titre du composant en mode hors ligne */
  title?: string;
  /** Contenu alternatif à afficher en mode hors ligne (si non fourni, affiche uniquement l'erreur) */
  fallbackContent?: ReactNode;
  /** Fonction à appeler lors de la tentative de reconnexion */
  onRetry?: () => void;
  /** Erreur Appwrite si disponible */
  error?: {
    code?: number;
    type?: string;
    message?: string;
  };
  /** Si true, le composant vérifie l'état de connexion. Si false, il affiche toujours le contenu principal */
  checkOfflineStatus?: boolean;
}

/**
 * Composant qui affiche un contenu alternatif lorsque l'application est en mode hors ligne
 * ou rencontre des erreurs de connexion à Appwrite
 */
export function OfflineFallback({
  children,
  title,
  fallbackContent,
  onRetry,
  error,
  checkOfflineStatus = true,
}: OfflineFallbackProps) {
  // Mode hors ligne désactivé
  // const { isOffline } = useOffline();
  
  // Afficher le contenu normal si pas d'erreur spécifique
  // Le mode hors ligne est désactivé, donc on ignore isOffline
  if (!error) {
    return <>{children}</>;
  }
  
  // Sinon, afficher le contenu de fallback
  return (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <AppwriteConnectionError error={error} onRetry={onRetry} />
        {fallbackContent && (
          <div className="mt-4">
            {fallbackContent}
          </div>
        )}
      </CardContent>
    </Card>
  );
}