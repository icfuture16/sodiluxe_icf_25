'use client'

import { useState } from 'react'
import { BsCalendar3, BsX } from 'react-icons/bs'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type Period = 'today' | 'custom'

interface DateRangeFilterProps {
  onPeriodChange: (period: Period) => void
  onCustomRangeChange?: (startDate: Date, endDate: Date) => void
  disabled?: boolean
}

const periods = [
  { value: 'today', label: 'Aujourd\'hui' },
  { value: 'custom', label: 'Personnalisé' }
] as const

export default function DateRangeFilter({ onPeriodChange, onCustomRangeChange, disabled = false }: DateRangeFilterProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false)

  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period)
    if (period === 'custom') {
      setIsCustomPickerOpen(true)
    } else {
      onPeriodChange(period)
      setStartDate(null)
      setEndDate(null)
    }
  }

  const handleCustomDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates
    setStartDate(start)
    setEndDate(end)
    
    if (start && end && onCustomRangeChange) {
      onCustomRangeChange(start, end)
    }
  }



  return (
    <div className={`flex items-center gap-2 ${disabled ? 'opacity-60' : ''}`}>
      <div className="p-1.5 rounded-lg bg-primary/10">
        <BsCalendar3 className="h-5 w-5 text-primary" />
      </div>
      
      {!isCustomPickerOpen ? (
        <select
          value={selectedPeriod}
          onChange={(e) => handlePeriodChange(e.target.value as Period)}
          className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
          disabled={disabled}
        >
          {periods.map((period) => (
            <option key={period.value} value={period.value}>
              {period.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative flex items-center">
          <DatePicker
            selected={startDate}
            onChange={handleCustomDateChange}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            dateFormat="dd/MM/yyyy"
            className="rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary sm:text-sm sm:leading-6"
            placeholderText="Sélectionner les dates"
            disabled={disabled}
          />
          <button
            onClick={() => {
              setIsCustomPickerOpen(false)
              setSelectedPeriod('today')
              onPeriodChange('today')
            }}
            className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"
            disabled={disabled}
          >
            <BsX className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  )
}
