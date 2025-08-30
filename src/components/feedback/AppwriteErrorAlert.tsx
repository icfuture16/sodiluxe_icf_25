/**
 * Composant pour afficher une alerte en cas d'erreur Appwrite
 * Ce composant peut être utilisé dans toute l'application pour afficher des erreurs
 * liées à Appwrite de manière cohérente
 */

'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Database, WifiOff } from 'lucide-react';
import { useOffline } from '@/providers/OfflineProvider';

interface AppwriteErrorAlertProps {
  error: any;
  title?: string;
  className?: string;
  onRetry?: () => void;
}

/**
 * Composant pour afficher une alerte en cas d'erreur Appwrite
 * @param error L'erreur Appwrite
 * @param title Le titre de l'alerte (optionnel)
 * @param className Des classes CSS supplémentaires (optionnel)
 * @param onRetry Fonction à exécuter lors du clic sur le bouton "Réessayer" (optionnel)
 */
export function AppwriteErrorAlert({
  error,
  title = 'Erreur de connexion',
  className = '',
  onRetry,
}: AppwriteErrorAlertProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  // Mode hors ligne désactivé
  // const { isOffline } = useOffline();

  // Déterminer le type d'erreur
  const errorCode = error?.code || 0;
  const errorType = error?.type || '';
  const errorMessage = error?.message || 'Une erreur inconnue est survenue';

  // Déterminer l'icône et le message en fonction du type d'erreur
  let icon = <AlertCircle className="h-4 w-4" />;
  let message = errorMessage;

  if (errorType.includes('network') || errorCode === 0) {
    icon = <WifiOff className="h-4 w-4" />;
    message = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
  } else if (errorCode === 404) {
    icon = <Database className="h-4 w-4" />;
    message = 'La ressource demandée n\'existe pas. Vérifiez votre configuration Appwrite.';
  } else if (errorCode === 401) {
    message = 'Vous n\'êtes pas autorisé à accéder à cette ressource. Veuillez vous reconnecter.';
  }

  // Gérer le clic sur le bouton "Réessayer"
  const handleRetry = async () => {
    if (!onRetry) return;

    setIsRetrying(true);
    try {
      await onRetry();
    } catch (error) {
      console.error('Erreur lors de la nouvelle tentative:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Alert
      variant="destructive"
      className={`my-4 ${className}`}
    >
      {icon}
      <div className="flex-1">
        <AlertTitle className="flex items-center gap-2">
          {title}
        </AlertTitle>
        <AlertDescription>
          <p className="text-sm mb-2">{message}</p>
          {errorCode > 0 && (
            <p className="text-xs mb-3">
              Code d'erreur: {errorCode} ({errorType})
            </p>
          )}
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Tentative en cours...
                </>
              ) : (
                <>Réessayer</>
              )}
            </Button>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}