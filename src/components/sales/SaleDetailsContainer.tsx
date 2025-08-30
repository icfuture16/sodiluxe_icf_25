'use client'

import dynamic from 'next/dynamic'

// Import dynamique du composant client pour éviter les erreurs de prérendu
const SaleDetailsWrapper = dynamic(
  () => import('./SaleDetailsWrapper'),
  {
    ssr: false, // Désactive le rendu côté serveur pour ce composant
    loading: () => <div className="p-4 text-center">Chargement des détails de la vente...</div>
  }
)

export default function SaleDetailsContainer() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SaleDetailsWrapper />
    </div>
  )
}
