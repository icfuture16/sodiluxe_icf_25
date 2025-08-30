'use client'

interface ReservationCardProps {
  location: string
  date: Date
  details: {
    label: string
    value: number
  }[]
}

export default function ReservationCard({ location, date, details }: ReservationCardProps) {
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }).format(date)

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="font-medium text-gray-900">{location}</div>
        <div className="text-sm text-gray-500">{formattedDate}</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between items-center">
            <div className="text-sm text-gray-500">{detail.label}</div>
            <div className="font-medium text-gray-900">{detail.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
