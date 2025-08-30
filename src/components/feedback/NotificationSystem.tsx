'use client'

import { createContext, useContext, useCallback, useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BsCheckCircle, BsExclamationCircle, BsXCircle, BsInfoCircle } from 'react-icons/bs'

export type NotificationType = 'success' | 'error' | 'loading' | 'info'
type NotificationPriority = 'high' | 'medium' | 'low'

interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
  priority: NotificationPriority
  timestamp: number
  progress?: number
  action?: {
    label: string
    onClick: () => void
  }
  metadata?: Record<string, any>
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'progress'>) => string
  updateNotification: (id: string, updates: Partial<Notification>) => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const MAX_NOTIFICATIONS = 5
const NOTIFICATION_LIMIT_PER_PRIORITY = {
  high: 3,
  medium: 2,
  low: 1,
}

const ICONS = {
  success: BsCheckCircle,
  error: BsExclamationCircle,
  loading: BsXCircle,
  info: BsInfoCircle,
}

const COLORS = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  loading: 'bg-blue-50 border-blue-200',
  info: 'bg-yellow-50 border-yellow-200',
}

const ICON_COLORS = {
  success: 'text-green-500',
  error: 'text-red-500',
  loading: 'text-blue-500',
  info: 'text-yellow-500',
}

function NotificationItem({ notification, onDismiss }: { notification: Notification; onDismiss: (id: string) => void }) {
  const Icon = ICONS[notification.type]
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (notification.duration) {
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const newProgress = Math.min(100, (elapsed / notification.duration!) * 100)
        setProgress(newProgress)

        if (newProgress >= 100) {
          clearInterval(interval)
          onDismiss(notification.id)
        }
      }, 50)

      return () => clearInterval(interval)
    }
  }, [notification.duration, notification.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-lg border shadow-sm ${COLORS[notification.type]}`}
    >
      <div className="flex items-center gap-3 p-4">
        <Icon className={`h-5 w-5 ${ICON_COLORS[notification.type]}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{notification.message}</p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-1 text-sm font-medium text-primary hover:text-primary/80"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button onClick={() => onDismiss(notification.id)} className="p-1 text-gray-500 hover:text-gray-800">
          <BsXCircle className="h-5 w-5" />
        </button>
      </div>
      {notification.duration && (
        <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
          <div
            className={`h-full ${ICON_COLORS[notification.type]}`}
            style={{ width: `${100 - progress}%` }}
          />
        </div>
      )}
    </motion.div>
  )
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const notificationQueue = useRef<Notification[]>([])

  const processQueue = useCallback(() => {
    setNotifications(currentNotifications => {
      const canAddMore = currentNotifications.length < MAX_NOTIFICATIONS;
      if (!canAddMore || notificationQueue.current.length === 0) {
        return currentNotifications;
      }

      const priorityCounts = currentNotifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {} as Record<NotificationPriority, number>);

      // Find the index of the first notification in the queue that can be displayed.
      const nextNotificationIndex = notificationQueue.current.findIndex(
        (notification) => (priorityCounts[notification.priority] || 0) < NOTIFICATION_LIMIT_PER_PRIORITY[notification.priority]
      );

      if (nextNotificationIndex === -1) {
        return currentNotifications;
      }

      // Extract the notification and update the queue
      const [notificationToAdd] = notificationQueue.current.splice(nextNotificationIndex, 1);

      return [...currentNotifications, notificationToAdd];
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(processQueue, 100)
    return () => clearInterval(interval)
  }, [processQueue])

  const showNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'progress'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      progress: 0,
    }

    // Utiliser setTimeout pour éviter les mises à jour d'état pendant le rendu
    setTimeout(() => {
      notificationQueue.current.push(newNotification)
      processQueue()
    }, 0)

    return id
  }, [processQueue])

  const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
    // Utiliser setTimeout pour éviter les mises à jour d'état pendant le rendu
    setTimeout(() => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, ...updates } : notification
        )
      )
    }, 0)
  }, [])

  const clearNotification = useCallback((id: string) => {
    // Utiliser setTimeout pour éviter les mises à jour d'état pendant le rendu
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 0)
  }, [])

  const clearAllNotifications = useCallback(() => {
    // Utiliser setTimeout pour éviter les mises à jour d'état pendant le rendu
    setTimeout(() => {
      setNotifications([])
      notificationQueue.current = []
    }, 0)
  }, [])

  return (
    <NotificationContext.Provider
      value={{ showNotification, updateNotification, clearNotification, clearAllNotifications }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onDismiss={clearNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
