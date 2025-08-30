import { Suspense } from 'react'
import Dashboard from '@/components/dashboard/DashboardStats'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

export const metadata = {
  title: 'Statistiques | CRM Sodiluxe',
  description: 'Tableau de bord des statistiques et analyses de performance',
}

export default function DashboardStatsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </DashboardLayout>
  )
}