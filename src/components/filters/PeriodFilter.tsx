'use client'

import { useState } from 'react'
import { BsCalendar } from 'react-icons/bs'

type Period = 'today' | 'week' | 'month' | 'custom'

interface PeriodFilterProps {
  selectedPeriod: Period
  onPeriodChange: (period: Period) => void
  startDate?: Date
  endDate?: Date
  onDateRangeChange?: (startDate: Date, endDate: Date) => void
}

export default function PeriodFilter({
  selectedPeriod,
  onPeriodChange,
  startDate,
  endDate,
  onDateRangeChange
}: PeriodFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customStartDate, setCustomStartDate] = useState<string>(
    startDate ? startDate.toISOString().split('T')[0] : ''
  )
  const [customEndDate, setCustomEndDate] = useState<string>(
    endDate ? endDate.toISOString().split('T')[0] : ''
  )

  const handlePeriodSelect = (period: Period) => {
    onPeriodChange(period)
    setIsOpen(false)
  }

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate && onDateRangeChange) {
      onDateRangeChange(new Date(customStartDate), new Date(customEndDate))
      onPeriodChange('custom')
      setIsOpen(false)
    }
  }

  const getPeriodLabel = (period: Period): string => {
    switch (period) {
      case 'today':
        return "Aujourd'hui"
      case 'week':
        return 'Cette semaine'
      case 'month':
        return 'Ce mois'
      case 'custom':
        return 'Période personnalisée'
      default:
        return 'Sélectionner une période'
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BsCalendar className="h-4 w-4 text-gray-500" />
        {getPeriodLabel(selectedPeriod)}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-72 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              className={`block w-full px-4 py-2 text-left text-sm ${selectedPeriod === 'today' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
              onClick={() => handlePeriodSelect('today')}
            >
              Aujourd'hui
            </button>
            <button
              className={`block w-full px-4 py-2 text-left text-sm ${selectedPeriod === 'week' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
              onClick={() => handlePeriodSelect('week')}
            >
              Cette semaine
            </button>
            <button
              className={`block w-full px-4 py-2 text-left text-sm ${selectedPeriod === 'month' ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} hover:bg-gray-100`}
              onClick={() => handlePeriodSelect('month')}
            >
              Ce mois
            </button>
            <div className="border-t border-gray-100 my-1"></div>
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Période personnalisée</p>
              <div className="space-y-2">
                <div>
                  <label htmlFor="start-date" className="block text-xs text-gray-500">
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="start-date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs text-gray-500">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="end-date"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={handleCustomDateSubmit}
                  disabled={!customStartDate || !customEndDate}
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}