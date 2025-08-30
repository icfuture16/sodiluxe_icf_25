import { Suspense } from 'react'
import GestionPersonnelleClient from './GestionPersonnelleClient'
import PageProtection from '@/components/auth/PageProtection'

export const metadata = {
  title: 'Gestion personnelle - CRM Sodiluxe',
  description: 'Consultez votre planning, vos objectifs et vos tâches journalières'
}

export default function GestionPersonnellePage() {
  return (
    <PageProtection>
      <Suspense fallback={<div className="p-8 flex justify-center items-center">Chargement...</div>}>
        <GestionPersonnelleClient />
      </Suspense>
    </PageProtection>
  )
}
