'use client'

import { Suspense } from 'react'
import CatalogueProduitsClient from './CatalogueProduitsClient'

export default function CatalogueProduits() {
  return (
    <Suspense fallback={<div className="p-8">Chargement du catalogue produits...</div>}>
      <CatalogueProduitsClient />
    </Suspense>
  )
}
