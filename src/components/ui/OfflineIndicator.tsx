/**
 * Composant pour afficher un indicateur lorsque l'application est en mode hors ligne
 */

'use client';

import { useEffect, useState } from 'react';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';
import { AlertCircle, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  // Mode hors ligne désactivé - l'indicateur ne s'affichera jamais
  const { isOffline, lastOnlineAt, checkConnection } = useOfflineDetection();
  const [isChecking, setIsChecking] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  // Mode hors ligne désactivé - l'indicateur ne s'affichera jamais
  useEffect(() => {
    // Toujours définir showIndicator à false pour ne jamais afficher l'indicateur
    setShowIndicator(false);
    
    return () => {
      // Rien à nettoyer
    };
  }, [isOffline]);

  // Formater la date de dernière connexion
  const formatLastOnline = () => {
    if (!lastOnlineAt) return 'Jamais';

    const now = new Date();
    const diffMs = now.getTime() - lastOnlineAt.getTime();
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 1) return 'Il y a moins d\'une minute';
    if (diffMins === 1) return 'Il y a 1 minute';
    if (diffMins < 60) return `Il y a ${diffMins} minutes`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Il y a 1 heure';
    if (diffHours < 24) return `Il y a ${diffHours} heures`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Il y a 1 jour';
    return `Il y a ${diffDays} jours`;
  };

  // Fonction pour vérifier manuellement la connexion
  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      await checkConnection();
    } catch (error) {
      console.error('Erreur lors de la vérification de la connexion:', error);
    } finally {
      setIsChecking(false);
    }
  };

  if (!showIndicator) return null;

  return (
    <Alert
      variant="destructive"
      className={`fixed bottom-4 right-4 w-auto max-w-md z-50 shadow-lg ${className}`}
    >
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        <AlertTitle className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          Mode hors ligne
        </AlertTitle>
        <AlertDescription>
          <p className="text-sm mb-2">
            Vous êtes actuellement en mode hors ligne. Certaines fonctionnalités peuvent être limitées.
          </p>
          {lastOnlineAt && (
            <p className="text-xs mb-3">
              Dernière connexion : {formatLastOnline()}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleCheckConnection}
            disabled={isChecking}
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>Vérifier la connexion</>
            )}
          </Button>
        </AlertDescription>
      </div>
    </Alert>
  );
}