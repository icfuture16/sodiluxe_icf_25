import { useState, useCallback, useEffect } from 'react'
import { useNotification, NotificationType } from '@/components/feedback/NotificationSystem'

type GroupedNotification = {
  id: string
  type: NotificationType
  message: string
  count: number
  timestamp: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Hook pour gérer les notifications groupées
 * Permet de regrouper des notifications similaires en une seule avec un compteur
 * 
 * @returns Des fonctions pour afficher et gérer les notifications groupées
 */
export function useGroupedNotifications() {
  const { showNotification, clearNotification: dismissNotification } = useNotification()
  const [groupedNotifications, setGroupedNotifications] = useState<Record<string, GroupedNotification>>({})

  // Nettoyer les notifications anciennes (plus de 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setGroupedNotifications(prev => {
        const updated = { ...prev }
        let hasChanges = false

        Object.keys(updated).forEach(key => {
          // Supprimer les notifications de plus de 5 minutes
          if (now - updated[key].timestamp > 5 * 60 * 1000) {
            delete updated[key]
            hasChanges = true
          }
        })

        return hasChanges ? updated : prev
      })
    }, 60 * 1000) // Vérifier chaque minute

    return () => clearInterval(interval)
  }, [])

  // Afficher une notification groupée
  const showGroupedNotification = useCallback(
    (type: NotificationType, message: string, groupKey: string, options?: { action?: { label: string; onClick: () => void } }) => {
      // Capturer les valeurs nécessaires avant les opérations asynchrones
      const now = Date.now()
      
      setGroupedNotifications(prev => {
        const existing = prev[groupKey]

        if (existing) {
          // Mettre à jour la notification existante
          const updated = {
            ...existing,
            count: existing.count + 1,
            timestamp: now
          }

          // Mettre à jour l'affichage de la notification
          const displayMessage = `${message} (${updated.count})`
          
          // Utiliser setTimeout pour éviter les mises à jour d'état pendant le rendu
          setTimeout(() => {
            dismissNotification(existing.id)
            
            // Ne pas passer d'options vides pour éviter la duplication
            const notificationOptions = options && Object.keys(options).length > 0 ? options : undefined
            const newId = showNotification({ 
              type, 
              message: displayMessage, 
              priority: 'medium', 
              ...(notificationOptions || {})
            })
            
            // Mettre à jour l'ID après avoir montré la notification
            setGroupedNotifications(latestPrev => ({
              ...latestPrev,
              [groupKey]: {
                ...updated,
                id: newId
              }
            }))
          }, 0)
          
          // Retourner l'état intermédiaire sans appeler showNotification pendant le rendu
          return {
            ...prev,
            [groupKey]: updated
          }
        } else {
          // Créer une nouvelle notification groupée
          const newNotification = {
            id: '', // ID temporaire qui sera mis à jour
            type,
            message,
            count: 1,
            timestamp: now,
            action: options?.action
          }
          
          // Utiliser setTimeout pour éviter les mises à jour d'état pendant le rendu
          setTimeout(() => {
            // Ne pas passer d'options vides pour éviter la duplication
            const notificationOptions = options && Object.keys(options).length > 0 ? options : undefined
            const id = showNotification({ 
              type, 
              message, 
              priority: 'medium', 
              ...(notificationOptions || {})
            })
            
            // Mettre à jour l'ID après avoir montré la notification
            setGroupedNotifications(latestPrev => ({
              ...latestPrev,
              [groupKey]: {
                ...newNotification,
                id
              }
            }))
          }, 0)
          
          // Retourner l'état intermédiaire sans appeler showNotification pendant le rendu
          return {
            ...prev,
            [groupKey]: newNotification
          }
        }
      })
    },
    [showNotification, dismissNotification]
  )

  // Supprimer une notification groupée
  const dismissGroupedNotification = useCallback(
    (groupKey: string) => {
      setGroupedNotifications(prev => {
        const existing = prev[groupKey]
        if (existing) {
          // Capturer l'ID avant de mettre à jour l'état
          const notificationId = existing.id
          
          // Utiliser setTimeout pour éviter les mises à jour d'état pendant le rendu
          setTimeout(() => {
            dismissNotification(notificationId)
          }, 0)
          
          const updated = { ...prev }
          delete updated[groupKey]
          return updated
        }
        return prev
      })
    },
    [dismissNotification]
  )

  return {
    showGroupedNotification,
    dismissGroupedNotification,
    groupedNotifications
  }
}