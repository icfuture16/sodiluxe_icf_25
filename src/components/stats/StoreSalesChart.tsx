'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { BsShop } from 'react-icons/bs'
import { formatCurrency } from '@/lib/utils/formatters'

interface StoreSalesData {
  name: string
  value: number
  color: string
}

interface StoreSalesChartProps {
  data: StoreSalesData[]
  className?: string
}

export default function StoreSalesChart({ data, className = '' }: StoreSalesChartProps) {
  // Utilisation de la fonction formatCurrency importée

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const formatPercentage = (value: number) => {
    return `${((value / total) * 100).toFixed(1)}%`
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BsShop className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Répartition des ventes par boutique</h3>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name} (${formatPercentage(value)})`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Ventes']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
