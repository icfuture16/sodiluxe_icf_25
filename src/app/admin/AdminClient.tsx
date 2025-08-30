'use client'

import Link from 'next/link'
import { BsShop, BsPeople, BsGear, BsGraphUp, BsClipboardCheck, BsTools, BsCreditCard } from 'react-icons/bs'
import PageProtection from '@/components/auth/PageProtection'

interface AdminModuleProps {
  title: string
  description: string
  href: string
  icon: React.ElementType
  color: string
}

const AdminModule = ({ title, description, href, icon: Icon, color }: AdminModuleProps) => {
  const isSystemSettings = title === 'Paramètres Système'
  
  return (
    <Link 
      href={href}
      className={`block p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border group ${
        isSystemSettings 
          ? 'border-red-400 border-2 animate-pulse hover:border-red-500 shadow-red-200/50' 
          : 'border-gray-100 hover:border-blue-200'
      }`}
    >
      <div className="flex items-start space-x-5">
        <div className={`p-4 rounded-xl ${color} shadow-md transform transition-transform group-hover:rotate-3 group-hover:scale-110 ${
          isSystemSettings ? 'ring-2 ring-red-300 ring-opacity-50' : ''
        }`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  )
}

export default function AdminClient() {
  const adminModules = [
    {
      title: 'Gestion des Objectifs',
      description: 'Définir les objectifs et tâches mensuelles',
      href: '/admin/objectives',
      icon: BsClipboardCheck,
      color: 'bg-emerald-500'
    },
    {
      title: 'Gestion des Boutiques',
      description: 'Ajouter, modifier ou supprimer des boutiques',
      href: '/admin/stores',
      icon: BsShop,
      color: 'bg-blue-500'
    },

    {
      title: 'Gestion des Utilisateurs',
      description: 'Gérer les comptes et les permissions',
      href: '/admin/users',
      icon: BsPeople,
      color: 'bg-green-500'
    },
    {
      title: 'Gestion des Clients',
      description: 'Gérer les points de fidélité des clients',
      href: '/admin/clients',
      icon: BsCreditCard,
      color: 'bg-purple-500'
    },
    {
      title: 'Paramètres Système',
      description: 'accès restreint spécialement dédié aux développeurs',
      href: '/admin/settings',
      icon: BsGear,
      color: 'bg-orange-500'
    }
  ]

  return (
    <PageProtection>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in">
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Gérez votre système de vente avec des outils puissants et intuitifs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
            {adminModules.map((module, index) => (
              <div
                key={index}
                className="transform transition-all duration-300 hover:scale-105 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AdminModule
                  title={module.title}
                  description={module.description}
                  icon={module.icon}
                  href={module.href}
                  color={module.color}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageProtection>
  )
}
