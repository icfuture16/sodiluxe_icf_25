'use client'

import { useMemo } from 'react'
import { BsGraphUp, BsGraphDown } from 'react-icons/bs'
import { formatCurrency } from '@/lib/utils/formatters'
import { DashboardData } from '@/hooks/useDashboardData'

interface DashboardKPIsProps {
  data: DashboardData | undefined
  isLoading: boolean
}

export default function DashboardKPIs({ data, isLoading }: DashboardKPIsProps) {
  const kpis = useMemo(() => {
    if (!data) return []

    return [
      {
        id: 'revenue',
        name: "Chiffre d'affaires",
        value: data.revenue.value,
        formattedValue: formatCurrency(data.revenue.value),
        previousValue: data.revenue.previousValue,
        changePercent: data.revenue.changePercent || 0,
        trend: data.revenue.trend || 0,
        unit: data.revenue.unit,
        period: data.revenue.period
      },
      {
        id: 'sales',
        name: 'Ventes',
        value: data.sales.value,
        formattedValue: data.sales.value.toString(),
        previousValue: data.sales.previousValue,
        changePercent: data.sales.changePercent || 0,
        trend: data.sales.trend || 0,
        unit: data.sales.unit,
        period: data.sales.period
      },
      {
        id: 'customers',
        name: 'Clients',
        value: data.customers.value,
        formattedValue: data.customers.value.toString(),
        previousValue: data.customers.previousValue,
        changePercent: data.customers.changePercent || 0,
        trend: data.customers.trend || 0,
        unit: data.customers.unit,
        period: data.customers.period
      },
      {
        id: 'avg_basket',
        name: 'Panier moyen',
        value: data.averageBasket.value,
        formattedValue: formatCurrency(data.averageBasket.value),
        previousValue: data.averageBasket.previousValue,
        changePercent: data.averageBasket.changePercent || 0,
        trend: data.averageBasket.trend || 0,
        unit: data.averageBasket.unit,
        period: data.averageBasket.period
      }
    ]
  }, [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {kpis.map((kpi) => (
        <div key={kpi.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{kpi.name}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{kpi.formattedValue}</p>
            </div>
            
          </div>
          
          
        </div>
      ))}
    </div>
  )
}