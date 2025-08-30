'use client'

import Dashboard from '@/components/dashboard/Dashboard'
import PageProtection from '@/components/auth/PageProtection'

export default function Home() {
  return (
    <PageProtection>
      <Dashboard />
    </PageProtection>
  )
}
