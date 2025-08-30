'use client'

import { ReactNode } from 'react'
import { IconType } from 'react-icons'

interface StatCardProps {
  title: string
  icon: IconType
  children: ReactNode
  className?: string
}

export default function StatCard({ title, icon: Icon, children, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="mt-4">
          {children}
        </div>
      </div>
    </div>
  )
}
