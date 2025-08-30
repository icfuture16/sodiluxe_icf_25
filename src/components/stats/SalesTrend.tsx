'use client'

interface SalesTrendProps {
  storeName: string
  storeInitial: string
  trend: number
  description: string
}

export default function SalesTrend({ storeName, storeInitial, trend, description }: SalesTrendProps) {
  const isPositive = trend > 0

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold">
          {storeInitial}
        </div>
        <div>
          <div className="font-medium text-gray-900">{storeName}</div>
          <div className="text-sm text-gray-500">{description}</div>
        </div>
      </div>
      <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {trend}
      </div>
    </div>
  )
}
