'use client'

import { createContext, useContext, useCallback, useState } from 'react'
import QueryNotification from './QueryNotification'

interface Notification {
  id: string
  type: 'success' | 'error' | 'loading'
  message: string
  duration?: number
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  clearNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications((prev) => [...prev, { ...notification, id }])
  }, [])

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification, clearNotification }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 min-w-[320px]">
        {notifications.map((notification) => (
          <QueryNotification
            key={notification.id}
            notification={notification}
            onDismiss={clearNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
