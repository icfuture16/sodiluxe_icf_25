import { useCallback } from 'react'
import { useNotification } from '@/components/feedback/NotificationSystem'

/**
 * Type pour les erreurs Appwrite
 */
interface AppwriteError {
  code: number;
  type: string;
  message: string;
  response?: string;
}

/**
 * Vérifie si une erreur est une erreur Appwrite
 * @param error L'erreur à vérifier
 * @returns true si l'erreur est une erreur Appwrite, false sinon
 */
function isAppwriteError(error: unknown): error is AppwriteError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    'type' in error &&
    'message' in error
  )
}

/**
 * Hook pour gérer les erreurs de manière centralisée
 * Affiche une notification d'erreur et peut exécuter une action de récupération
 * Gère spécifiquement les erreurs Appwrite et le mode hors ligne
 * 
 * @returns Une fonction pour gérer les erreurs
 */
export function useErrorHandler() {
  const { showNotification } = useNotification()

  const handleError = useCallback(
    (error: unknown, customMessage?: string, retryAction?: () => void) => {
      // Extraire le message d'erreur selon le type d'erreur
      let errorMessage = 'Une erreur inconnue est survenue'
      let errorType = 'unknown'
      let errorCode = 0
      let priority: 'low' | 'medium' | 'high' = 'medium'
      // Vérifier si c'est une erreur Appwrite
      if (isAppwriteError(error)) {
        errorMessage = error.message
        errorType = error.type
        errorCode = error.code
        
        // Personnaliser le message selon le type d'erreur
        if (error.code === 401) {
          errorMessage = 'Vous n\'êtes pas autorisé à effectuer cette action'
          priority = 'high'
        } else if (error.code === 404) {
          errorMessage = 'La ressource demandée n\'existe pas'
          priority = 'medium'
        } else if (error.type.includes('network') || error.code === 0) {
          errorMessage = 'Impossible de se connecter au serveur'
          priority = 'high'
        }
      }
      // Erreur standard JavaScript
      else if (error instanceof Error) {
        errorMessage = error.message
        errorType = error.name
      } 
      // Erreur sous forme de chaîne
      else if (typeof error === 'string') {
        errorMessage = error
      } 
      // Autre type d'erreur avec un message
      else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message)
      }

      // Utiliser le message personnalisé s'il est fourni
      const displayMessage = customMessage || errorMessage

      // Afficher la notification
      showNotification({
        type: 'error',
        message: displayMessage,
        priority,
        action: retryAction ? {
          label: 'Réessayer',
          onClick: retryAction
        } : undefined,
        metadata: isAppwriteError(error) ? {
          code: errorCode,
          type: errorType
        } : undefined
      })

      // Journaliser l'erreur dans la console pour le débogage
      console.error(`Error (${errorType}):`, error)

      return {
        message: errorMessage,
        type: errorType,
        code: errorCode,
        isOfflineError: false
      }
    },
    [showNotification]
  )

  return handleError
}

