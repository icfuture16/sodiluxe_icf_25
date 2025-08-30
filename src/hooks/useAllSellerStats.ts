'use client'

import { useUsers } from './useUsers'
import { useSellerSales } from './useSellerSales'
import { useMemo, useState, useEffect } from 'react'

export interface SellerStats {
  userId: string
  fullName: string
  email: string
  role: string
  totalRevenue: number
  salesCount: number
  averageTicket: number
}

export function useAllSellerStats() {
  const { data: users, isLoading: usersLoading } = useUsers()
  const [isMounted, setIsMounted] = useState(false)
  
  // Gérer l'hydratation
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filtrer uniquement les vendeurs
  const sellers = useMemo(() => {
    return users?.filter(user => user.role === 'seller') || []
  }, [users])

  // Créer un tableau fixe de hooks pour éviter les hooks conditionnels
  const maxSellers = 50 // Limite raisonnable
  const sellerHooks = Array.from({ length: maxSellers }, (_, index) => {
    const seller = sellers[index]
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: sellerData, isLoading } = useSellerSales(
      seller?.$id || '', 
      seller ? null : undefined // Ne pas faire de requête si pas de vendeur
    )
    
    return {
      seller,
      data: seller ? sellerData : null,
      isLoading: seller ? isLoading : false
    }
  })

  // Filtrer seulement les hooks avec des vendeurs valides
  const validSellerStats = sellerHooks
    .filter(hook => hook.seller)
    .slice(0, sellers.length)

  const isLoading = !isMounted || usersLoading || validSellerStats.some(query => query.isLoading)

  // Calculer les statistiques globales
  const allSellerStats = validSellerStats.map(query => ({
    userId: query.seller!.$id,
    fullName: query.seller!.fullName,
    email: query.seller!.email,
    role: query.seller!.role,
    totalRevenue: query.data?.totalRevenue || 0,
    salesCount: query.data?.salesCount || 0,
    averageTicket: query.data?.averageTicket || 0,
    isLoading: query.isLoading
  }))

  // Top 3 des meilleurs vendeurs (par chiffre d'affaires)
  const topSellers = isMounted ? allSellerStats
    .filter(stat => !stat.isLoading)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3) : []

  // Vendeurs à risque (aucune vente ou très peu)
  const atRiskSellers = isMounted ? allSellerStats
    .filter(stat => !stat.isLoading && stat.salesCount === 0)
    .slice(0, 3) : []

  const sellerStats: SellerStats[] = useMemo(() => {
    return isMounted ? allSellerStats.filter(stat => !stat.isLoading) : []
  }, [allSellerStats, isMounted])

  return {
    sellerStats,
    topSellers,
    riskSellers: atRiskSellers,
    isLoading,
    isMounted
  }
}

// Hook pour formater les montants en FCFA
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('XOF', 'FCFA')
}