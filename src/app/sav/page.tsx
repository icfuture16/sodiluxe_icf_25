'use client'

import { Suspense } from 'react'
import SavClient from './SavClient'

export default function SavPage() {
  return (
    <Suspense fallback={<div className="p-8">Chargement du service après-vente...</div>}>
      <SavClient />
    </Suspense>
  )
}
