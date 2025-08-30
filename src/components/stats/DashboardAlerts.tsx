'use client'

import { BsBell, BsExclamationTriangle, BsTrophy, BsPersonSlash } from 'react-icons/bs'

interface Alert {
  id: string
  type: 'warning' | 'success' | 'info'
  message: string
  date: string
}

interface DashboardAlertsProps {
  alerts: Alert[]
  className?: string
}

export default function DashboardAlerts({ alerts, className = '' }: DashboardAlertsProps) {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return <BsExclamationTriangle className="h-5 w-5 text-amber-500" />
      case 'success':
        return <BsTrophy className="h-5 w-5 text-green-500" />
      case 'info':
        return <BsPersonSlash className="h-5 w-5 text-blue-500" />
      default:
        return <BsBell className="h-5 w-5 text-gray-500" />
    }
  }

  const getAlertBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50'
      case 'success':
        return 'bg-green-50'
      case 'info':
        return 'bg-blue-50'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BsBell className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Alertes & Notifications</h3>
      </div>
      
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-lg ${getAlertBgColor(alert.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">{alert.date}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <BsBell className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Aucune alerte pour le moment</p>
          </div>
        )}
      </div>
    </div>
  )
}