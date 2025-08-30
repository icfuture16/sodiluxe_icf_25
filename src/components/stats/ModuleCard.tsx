'use client'

import { ReactNode } from 'react'
import { IconType } from 'react-icons'

interface ModuleCardProps {
  title: string
  icon: IconType
  children: ReactNode
  className?: string
}

export default function ModuleCard({ title, icon: Icon, children, className = '' }: ModuleCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        <div className="text-center">
          {children}
        </div>
      </div>
    </div>
  )
}