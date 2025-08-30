import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Database, Lock, Wifi, WifiOff } from 'lucide-react';
import { useOffline } from '@/providers/OfflineProvider';

interface AppwriteConnectionErrorProps {
  error?: {
    code?: number;
    type?: string;
    message?: string;
  };
  onRetry?: () => void;
}

/**
 * Composant pour afficher une erreur de connexion à Appwrite avec des instructions spécifiques
 */
export function AppwriteConnectionError({ error, onRetry }: AppwriteConnectionErrorProps) {
  // Mode hors ligne désactivé
  const { checkConnection } = useOffline();
  
  // Déterminer le type d'erreur pour afficher le message approprié
  let title = 'Erreur de connexion';
  let description = 'Impossible de se connecter à la base de données.';
  let icon = <AlertCircle className="h-5 w-5" />;
  
  // Mode hors ligne désactivé - on n'affiche plus de message spécifique pour le mode hors ligne
  
  // Analyser le code d'erreur
  if (error) {
    if (error.code === 401) {
      title = 'Erreur d\'authentification';
      description = 'Vous n\'êtes pas autorisé à accéder à cette ressource. Vérifiez vos clés API et permissions.';
      icon = <Lock className="h-5 w-5" />;
    } else if (error.code === 404) {
      title = 'Ressource introuvable';
      description = 'La base de données ou la collection demandée n\'existe pas. Vérifiez vos identifiants de base de données.';
      icon = <Database className="h-5 w-5" />;
    } else if (error.type?.includes('network') || error.code === 0) {
      title = 'Erreur réseau';
      description = 'Impossible de se connecter au serveur Appwrite. Vérifiez votre connexion internet.';
      icon = <Wifi className="h-5 w-5" />;
    }
  }

  const handleRetry = () => {
    // Vérifier la connexion avant d'appeler onRetry
    checkConnection().then(() => {
      if (onRetry) onRetry();
    });
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex items-center gap-2">
        {icon}
        <AlertTitle>{title}</AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        <p className="mb-3">{description}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}