'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

export default function ChunkErrorHandler() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const error = event.error
      
      // Vérifier si c'est une ChunkLoadError
      if (error && error.name === 'ChunkLoadError') {
        console.warn('ChunkLoadError détectée, rechargement de la page...', error)
        
        // Afficher une notification à l'utilisateur
        toast.error('Mise à jour détectée, rechargement de la page...', {
          duration: 2000,
        })
        
        // Recharger la page après un court délai
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
        // Empêcher l'affichage de l'erreur dans la console
        event.preventDefault()
        return true
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason
      
      // Vérifier si c'est une erreur liée aux chunks
      if (error && (error.name === 'ChunkLoadError' || 
          (typeof error === 'string' && error.includes('Loading chunk')))) {
        console.warn('Erreur de chunk détectée dans une promesse, rechargement...', error)
        
        toast.error('Mise à jour détectée, rechargement de la page...', {
          duration: 2000,
        })
        
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
        event.preventDefault()
        return true
      }
    }

    // Écouter les erreurs globales
    window.addEventListener('error', handleChunkError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Nettoyer les écouteurs lors du démontage
    return () => {
      window.removeEventListener('error', handleChunkError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null // Ce composant ne rend rien
}