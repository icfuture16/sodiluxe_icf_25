'use client'

import { Client } from '@/types/client.types'
import { FiMail, FiPhone, FiMapPin, FiStar } from 'react-icons/fi'
import { formatCurrency } from '@/lib/utils/formatters'

interface ClientCardProps {
  client: Client
  variant?: 'compact' | 'detailed' | 'summary'
  showActions?: boolean
  onSelect?: (client: Client) => void
}

export default function ClientCard({ 
  client, 
  variant = 'summary', 
  showActions = false,
  onSelect 
}: ClientCardProps) {
  // Utilisation de la fonction formatCurrency importée

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'premium':
        return 'bg-purple-100 text-purple-800'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800'
      case 'silver':
        return 'bg-gray-100 text-gray-800'
      case 'bronze':
      default:
        return 'bg-orange-100 text-orange-800'
    }
  }

  const getClientIcon = () => {
    if (client.gender === 'entreprise') {
      return <span className="text-gray-500 text-lg">🏢</span>
    } else if (client.gender === 'homme') {
      return <span className="text-gray-500 text-lg">👨</span>
    } else {
      return <span className="text-gray-500 text-lg">👩</span>
    }
  }

  if (variant === 'compact') {
    return (
      <div 
        className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
        onClick={() => onSelect && onSelect(client)}
      >
        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
          {getClientIcon()}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{client.fullName}</p>
          <p className="text-xs text-gray-500">{client.phone}</p>
        </div>
        {client.vipStatus && (
          <FiStar className="ml-auto h-5 w-5 text-yellow-500" />
        )}
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {client.fullName}
              {client.vipStatus && (
                <FiStar className="inline-block ml-2 h-5 w-5 text-yellow-500" />
              )}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSegmentColor(client.segment)}`}>
                {client.segment}
              </span>
            </p>
          </div>
          <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
            {getClientIcon()}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiMail className="mr-2" /> Email
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {client.email || 'Non renseigné'}
              </dd>
            </div>
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiPhone className="mr-2" /> Téléphone
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {client.phone}
              </dd>
            </div>
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <FiMapPin className="mr-2" /> Adresse
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {client.address || 'Non renseignée'}
              </dd>
            </div>
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Points fidélité</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {client.loyaltyPoints} points
              </dd>
            </div>
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total dépensé</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatCurrency(client.totalSpent)}
              </dd>
            </div>
          </dl>
        </div>
        {showActions && (
          <div className="border-t border-gray-200 px-4 py-4 sm:px-6 flex justify-end space-x-3">
            <button 
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => onSelect && onSelect(client)}
            >
              Sélectionner
            </button>
          </div>
        )}
      </div>
    )
  }

  // Default: summary variant
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
            {getClientIcon()}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              {client.fullName}
              {client.vipStatus && (
                <FiStar className="ml-2 h-5 w-5 text-yellow-500" />
              )}
            </h3>
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSegmentColor(client.segment)}`}>
              {client.segment}
            </span>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="text-sm flex items-center">
            <FiMail className="mr-2 text-gray-400" />
            <span className="text-gray-900">{client.email || 'Non renseigné'}</span>
          </div>
          <div className="text-sm flex items-center">
            <FiPhone className="mr-2 text-gray-400" />
            <span className="text-gray-900">{client.phone}</span>
          </div>
          <div className="text-sm flex items-center col-span-2">
            <FiMapPin className="mr-2 text-gray-400" />
            <span className="text-gray-900">{client.address || 'Non renseignée'}</span>
          </div>
        </div>
      </div>
      <div className="px-4 py-4 sm:px-6 bg-gray-50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Points fidélité</p>
            <p className="text-sm font-medium text-gray-900">{client.loyaltyPoints} points</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total dépensé</p>
            <p className="text-sm font-medium text-gray-900">{formatCurrency(client.totalSpent)}</p>
          </div>
        </div>
      </div>
      {showActions && (
        <div className="px-4 py-4 sm:px-6 flex justify-end">
          <button 
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => onSelect && onSelect(client)}
          >
            Sélectionner
          </button>
        </div>
      )}
    </div>
  )
}