'use client'

import { IconType } from 'react-icons'

interface QuickStatProps {
  icon: IconType
  label: string
  value: string | number
  trend?: {
    value: number
    label: string
    icon: IconType
  }
}

export default function QuickStat({ icon: Icon, label, value, trend }: QuickStatProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-xl font-semibold text-gray-900" style={{whiteSpace: 'pre-line'}}>{value}</p>
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-xs">
          <trend.icon 
            className={`mr-1 h-3 w-3 ${
              trend.value >= 0 ? 'text-green-500' : 'text-red-500'
            }`} 
          />
          <span 
            className={
              trend.value >= 0 ? 'text-green-500' : 'text-red-500'
            }
          >
            {trend.value >= 0 ? '+' : ''}{typeof trend.value === 'number' ? trend.value : trend.value}%
          </span>
          <span className="text-gray-500 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
