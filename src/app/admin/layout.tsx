import React from 'react'
import { BsArrowLeft } from 'react-icons/bs'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-primary hover:text-primary/80">
                <BsArrowLeft className="h-5 w-5 mr-2" />
                <span className="font-medium">Retour au tableau de bord</span>
              </Link>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-secondary">Administration</h1>
            </div>
            <div className="w-40">  {/* Espace vide pour équilibrer le header */}
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}