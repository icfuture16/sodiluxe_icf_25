'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { BsGraphUp } from 'react-icons/bs'
import { formatCurrency } from '@/lib/utils/formatters'

interface RevenueData {
  date: string
  revenue: number
  target?: number
}

interface RevenueChartProps {
  data: RevenueData[]
  className?: string
  showTarget?: boolean
}

export default function RevenueChart({ data, className = '', showTarget = true }: RevenueChartProps) {
  // Utilisation de la fonction formatCurrency importée

  // Calculer la moyenne des objectifs si disponible
  const averageTarget = showTarget && data.some(item => item.target !== undefined)
    ? data.reduce((sum, item) => sum + (item.target || 0), 0) / data.length
    : undefined

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BsGraphUp className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Évolution du Chiffre d&apos;Affaires</h3>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Chiffre d&apos;affaires']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              }}
              labelStyle={{ fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
            {showTarget && data.some(item => item.target !== undefined) && (
              <Line
                type="monotone"
                dataKey="target"
                stroke="#94a3b8"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />
            )}
            {averageTarget && (
              <ReferenceLine 
                y={averageTarget} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
                label={{
                  value: 'Objectif',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 12
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}