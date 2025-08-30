'use client'

import { useEffect, useState } from 'react'
import { BsCheckCircle, BsExclamationCircle, BsXCircle } from 'react-icons/bs'

type NotificationType = 'success' | 'error' | 'loading'

interface Notification {
  id: string
  type: NotificationType
  message: string
  duration?: number
}

interface QueryNotificationProps {
  notification: Notification
  onDismiss: (id: string) => void
}

const icons = {
  success: BsCheckCircle,
  error: BsExclamationCircle,
  loading: BsXCircle,
}

const colors = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  loading: 'bg-blue-50 text-blue-800 border-blue-200',
}

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  loading: 'text-blue-500',
}

export default function QueryNotification({ notification, onDismiss }: QueryNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const Icon = icons[notification.type]

  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss(notification.id), 300)
      }, notification.duration)

      return () => clearTimeout(timer)
    }
  }, [notification, onDismiss])

  if (!isVisible) return null

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${
        colors[notification.type]
      } transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <Icon className={`h-5 w-5 ${iconColors[notification.type]}`} />
      <p className="text-sm font-medium">{notification.message}</p>
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => onDismiss(notification.id), 300)
        }}
        className="ml-auto p-1 hover:opacity-70"
      >
        <BsXCircle className="h-5 w-5" />
      </button>
    </div>
  )
}
