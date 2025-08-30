'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SaleDetailsClient from './SaleDetailsClient'

export default function SaleDetailsWrapper() {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Utilisation de useEffect pour récupérer les paramètres de requête
  // pour éviter les problèmes de prérendu
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const saleId = searchParams.get('id') || ''
    setId(saleId)
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div className="p-4 text-center">Chargement des détails de la vente...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {id ? (
        <SaleDetailsClient id={id} />
      ) : (
        <div className="p-4 text-center text-red-500 font-medium">
          Identifiant de vente manquant. Veuillez sélectionner une vente depuis la liste des ventes.
        </div>
      )}
    </div>
  )
}
