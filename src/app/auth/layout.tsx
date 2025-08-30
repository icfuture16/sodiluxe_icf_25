import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentification - CRM Sodiluxe',
  description: 'Connexion et inscription au CRM Sodiluxe',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}