'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import SaleDetailsClient from './SaleDetailsClient'

export default function SalesDetailsWrapper() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id') || ''

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="p-4 text-center">Chargement des détails de la vente...</div>}>
        {id ? (
          <SaleDetailsClient id={id} />
        ) : (
          <div className="p-4 text-center text-red-500 font-medium">
            Identifiant de vente manquant. Veuillez sélectionner une vente depuis la liste des ventes.
          </div>
        )}
      </Suspense>
    </div>
  )
}
