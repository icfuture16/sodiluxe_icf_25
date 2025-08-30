'use client'

import { ReactNode } from 'react'
import { IconType } from 'react-icons'

interface SimpleStatCardProps {
  title: string
  icon: IconType
  value?: string | number
  trend?: string
  className?: string
}

export default function SimpleStatCard({ title, icon: Icon, value, trend, className = '' }: SimpleStatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          </div>
          {value && (
            <span className="text-sm font-medium text-gray-900">{value}</span>
          )}
        </div>
        {trend && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">{trend}</p>
          </div>
        )}
      </div>
    </div>
  )
}