'use client'

import { useMemo } from 'react'
import { BsShop, BsPeople, BsBox } from 'react-icons/bs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'
import { DashboardData } from '@/hooks/useDashboardData'
import StatCard from '../stats/StatCard'

interface DashboardChartsProps {
  data: DashboardData | undefined
  isLoading: boolean
}

export default function DashboardCharts({ data, isLoading }: DashboardChartsProps) {
  const storeData = useMemo(() => {
    if (!data?.revenue.breakdown?.byStore) return []
    return data.revenue.breakdown.byStore
  }, [data])

  const topProducts = useMemo(() => {
    if (!data?.products.topProducts) return []
    return data.products.topProducts.slice(0, 5)
  }, [data])

  const renderStoreChart = () => {
    if (isLoading) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Chargement des données...</p>
        </div>
      )
    }

    if (!storeData.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Aucune donnée disponible</p>
        </div>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={storeData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => formatCurrency(value)} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="value" fill="#6366f1" />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const renderProductsChart = () => {
    if (isLoading) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Chargement des données...</p>
        </div>
      )
    }

    if (!topProducts.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <p>Aucune donnée disponible</p>
        </div>
      )
    }

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981']

    const productData = topProducts.map((product, index) => ({
      name: product.name,
      value: product.revenue,
      color: colors[index % colors.length]
    }))

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={productData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {productData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
      <StatCard title="Performance par boutique" icon={BsShop}>
        {renderStoreChart()}
      </StatCard>

      <StatCard title="Top produits" icon={BsBox}>
        {renderProductsChart()}
      </StatCard>
    </div>
  )
}