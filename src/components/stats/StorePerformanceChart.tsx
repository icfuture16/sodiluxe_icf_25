'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { BsShop } from 'react-icons/bs'

interface StorePerformanceData {
  storeName: string
  revenue: number
  target: number
  achievement: number
}

interface StorePerformanceChartProps {
  data: StorePerformanceData[]
  className?: string
}

export default function StorePerformanceChart({ data, className = '' }: StorePerformanceChartProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(0)}%`
  }

  const getAchievementColor = (achievement: number) => {
    if (achievement >= 100) return '#10b981' // vert
    if (achievement >= 80) return '#6366f1' // bleu/violet
    if (achievement >= 50) return '#f59e0b' // orange
    return '#ef4444' // rouge
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BsShop className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Performance par Boutique</h3>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              tickFormatter={formatAmount}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis 
              dataKey="storeName" 
              type="category" 
              width={100} 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip
              formatter={(value: number) => [formatAmount(value), 'Chiffre d\'affaires']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
              }}
            />
            <Bar dataKey="revenue" name="Réalisé" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getAchievementColor(entry.achievement)} />
              ))}
              <LabelList 
                dataKey="achievement" 
                position="right" 
                formatter={formatPercentage}
                style={{ fontSize: 12, fill: '#6b7280' }}
              />
            </Bar>
            <Bar dataKey="target" name="Objectif" fill="#e5e7eb" radius={[4, 4, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}