'use client'

import React from 'react'
import { Client } from '@/types/client.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Gift, Star, Award } from 'lucide-react'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'

interface LoyaltyTabProps {
  client: Client
}

const getLoyaltyStatusColor = (status?: string) => {
  switch (status) {
    case 'or':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'argent':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'bronze':
    default:
      return 'bg-orange-100 text-orange-800 border-orange-200'
  }
}

const getLoyaltyStatusIcon = (status?: string) => {
  switch (status) {
    case 'or':
      return <Award className="h-4 w-4" />
    case 'argent':
      return <Star className="h-4 w-4" />
    case 'bronze':
    default:
      return <Gift className="h-4 w-4" />
  }
}

const getNextLevelInfo = (currentPoints: number, currentStatus: string | undefined, loyaltyLevels: any) => {
  const goldThreshold = loyaltyLevels.gold.threshold
  const silverThreshold = loyaltyLevels.silver.threshold
  
  if (currentStatus === 'or' || currentPoints >= goldThreshold) {
    return { nextLevel: null, pointsNeeded: 0, progress: 100 }
  }
  
  if (currentPoints >= silverThreshold) {
    return {
      nextLevel: 'Or',
      pointsNeeded: goldThreshold - currentPoints,
      progress: (currentPoints / goldThreshold) * 100
    }
  }
  
  return {
    nextLevel: 'Argent',
    pointsNeeded: silverThreshold - currentPoints,
    progress: (currentPoints / silverThreshold) * 100
  }
}

export default function LoyaltyTab({ client }: LoyaltyTabProps) {
  const { settings } = useSystemSettings()
  
  // Générer le numéro de carte basé sur l'ID du client (fallback si pas de numéro sauvegardé)
  const generateCardNumber = (clientId: string) => {
    // Prendre les 8 premiers caractères de l'ID et les formater
    const idPart = clientId.substring(0, 8).toUpperCase()
    return `${idPart.substring(0, 4)}-${idPart.substring(4, 8)}`
  }

  // Obtenir la couleur de la carte selon le statut
  const getCardColor = (status?: string) => {
    switch (status) {
      case 'bronze':
        return 'from-amber-600 to-amber-800'
      case 'argent':
        return 'from-gray-400 to-gray-600'
      case 'or':
        return 'from-yellow-400 to-yellow-600'
      default:
        return 'from-amber-600 to-amber-800'
    }
  }
  
  const nextLevelInfo = getNextLevelInfo(client.loyaltyPoints, client.loyaltyStatus, settings.loyaltyLevels)
  const cardNumber = client.loyaltyCardNumber || generateCardNumber(client.$id)

  return (
    <div className="space-y-6">
      {/* Carte de Fidélité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Statut de Fidélité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Statut actuel</div>
              <div className="flex items-center justify-center">
                <Badge className={getLoyaltyStatusColor(client.loyaltyStatus)}>
                  {getLoyaltyStatusIcon(client.loyaltyStatus)}
                  <span className="ml-1 capitalize">{client.loyaltyStatus || 'Bronze'}</span>
                </Badge>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Points disponibles</div>
              <div className="font-bold text-2xl text-blue-600">{client.loyaltyPoints || 0}</div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">N° Carte</div>
              <div className="font-mono text-sm">{cardNumber}</div>
            </div>
          </div>

          {/* Progression vers le prochain niveau */}
          {nextLevelInfo.nextLevel && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Prochain niveau</span>
                <span className="text-sm font-semibold">{nextLevelInfo.nextLevel}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(nextLevelInfo.progress, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Plus que {nextLevelInfo.pointsNeeded} points pour atteindre le niveau {nextLevelInfo.nextLevel}
              </div>
            </div>
          )}

          {/* Carte de Fidélité et Avantages */}
          <div className="flex gap-6 items-start">
            {/* Carte de Fidélité Visuelle - 3/5 de la largeur */}
            <div className="flex-shrink-0" style={{ width: '60%' }}>
              <div className={`relative bg-gradient-to-r ${getCardColor(client.loyaltyStatus)} rounded-xl p-6 text-white shadow-lg max-w-sm mx-auto`} style={{aspectRatio: '1.586/1'}}>
                <div className="flex justify-between items-start mb-4">
                   <div>
                     <h4 className="text-lg font-bold">CARTE FIDÉLITÉ</h4>
                     <p className="text-sm opacity-90">Sodiluxe</p>
                   </div>
                   {getLoyaltyStatusIcon(client.loyaltyStatus)}
                 </div>
                 
                 {/* Puce électronique */}
                 <div className="absolute top-20 right-6">
                   <div className="bg-gradient-to-br from-gray-300 to-gray-500 w-16 h-12 rounded-sm border border-gray-400 shadow-sm">
                     <div className="grid grid-cols-2 gap-px p-2 h-full">
                       <div className="bg-yellow-600 rounded-xs"></div>
                       <div className="bg-yellow-600 rounded-xs"></div>
                       <div className="bg-yellow-600 rounded-xs"></div>
                       <div className="bg-yellow-600 rounded-xs"></div>
                     </div>
                   </div>
                 </div>
                
                <div className="mb-4">
                  <p className="text-sm opacity-75 mb-1">Titulaire</p>
                  <p className="font-semibold text-lg">{client.fullName}</p>
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs opacity-75 mb-1">N° Carte</p>
                    <p className="font-mono text-sm">{cardNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75 mb-1">Statut</p>
                    <p className="font-bold capitalize">{client.loyaltyStatus || 'Bronze'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Avantages - 2/5 de la largeur */}
            <div className="bg-gray-50 rounded-lg p-4" style={{ width: '40%' }}>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Avantages :</h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">•</span>
                  Bronze : {settings.loyaltyLevels.bronze.rewardRate}% en points sur chaque achat
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  Argent : {settings.loyaltyLevels.silver.rewardRate}% en points + offres spéciales
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  Or : {settings.loyaltyLevels.gold.rewardRate}% en points + offres VIP + livraison gratuite
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}