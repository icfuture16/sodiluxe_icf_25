'use client'

import { Suspense } from 'react'
import ServicesClient from './ServicesClient'

// Page client-side pour être compatible avec le build statique
export default function ServicesPage() {
  return (
    <Suspense fallback={<div>Chargement des services...</div>}>
      <ServicesClient />
    </Suspense>
  )
}
