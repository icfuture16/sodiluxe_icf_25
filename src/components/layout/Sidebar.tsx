'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { BsGrid, BsShop, BsHeadset, BsPeople, BsCalendar, BsGear, BsChevronLeft, BsChevronRight, BsBoxArrowRight, BsPerson, BsClipboardCheck } from 'react-icons/bs'
import { useAuth } from '@/providers/AuthProvider'

const navigation = [
  { name: 'Tableau de bord', href: '/', icon: BsGrid },
  { name: 'Ventes', href: '/ventes', icon: BsShop },
  { name: 'SAV', href: '/services', icon: BsHeadset },
  { name: 'Clients', href: '/clients', icon: BsPeople },
  { name: 'Catalogue produits', href: '/catalogue-produits', icon: BsShop },
  { name: 'Réservations', href: '/reservations', icon: BsCalendar },
  { name: 'Mon Compte', href: '/account', icon: BsPerson },
  // Admin est géré séparément avec AdminNavLink
]

const HOVER_DELAY = 1500 // 1,5 seconde pour l'ouverture
const AUTO_CLOSE_DELAY = 5000 // 5 secondes pour la fermeture automatique

export default function Sidebar() {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState<boolean>(false) // Fermé par défaut
  const [isManuallyToggled, setIsManuallyToggled] = useState<boolean>(false) // Pour gérer le clic manuel
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { user, signOut, isAdmin } = useAuth()

  const clearAllTimeouts = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = undefined
    }
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current)
      autoCloseTimeoutRef.current = undefined
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (isManuallyToggled) return // Ne pas ouvrir automatiquement si ouvert manuellement
    
    clearAllTimeouts()
    
    // Délai de 2 secondes avant ouverture
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(true)
      // Programmer la fermeture automatique après 10 secondes
      autoCloseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false)
      }, AUTO_CLOSE_DELAY)
    }, HOVER_DELAY)
  }, [isManuallyToggled, clearAllTimeouts])

  const handleMouseLeave = useCallback(() => {
    if (isManuallyToggled) return // Ne pas fermer automatiquement si ouvert manuellement
    
    clearAllTimeouts()
    // Fermeture immédiate quand on quitte la zone
    setIsExpanded(false)
  }, [isManuallyToggled, clearAllTimeouts])

  const handleToggleClick = useCallback(() => {
    clearAllTimeouts()
    setIsExpanded(!isExpanded)
    setIsManuallyToggled(!isExpanded) // Marquer comme ouvert/fermé manuellement
    
    // Si on ouvre manuellement, programmer la fermeture automatique après 10 secondes
    if (!isExpanded) {
      autoCloseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false)
        setIsManuallyToggled(false)
      }, AUTO_CLOSE_DELAY)
    }
  }, [isExpanded, clearAllTimeouts])

  useEffect(() => {
    return () => {
      clearAllTimeouts()
    }
  }, [clearAllTimeouts])

  return (
    <div 
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        isExpanded ? 'w-72' : 'w-20'
      }`}
    >
      <div className="flex h-24 shrink-0 items-center justify-between px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Image
            className={`transition-all duration-300 ${isExpanded ? 'h-16 w-16' : 'h-12 w-12'}`}
            src="/logo.svg"
            alt="Sodiluxe"
            width={64}
            height={64}
            priority
          />
          {isExpanded && (
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Sodiluxe
            </span>
          )}
        </div>
        <button
          onClick={handleToggleClick}
          className="rounded-lg p-2 hover:bg-gray-100 focus:outline-none"
        >
          {isExpanded ? (
            <BsChevronLeft className="h-6 w-6 text-gray-500" />
          ) : (
            <BsChevronRight className="h-6 w-6 text-gray-500" />
          )}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-y-1.5 p-4">
        {/* Liens de navigation standard */}
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group relative flex items-center gap-x-3 p-3 rounded-lg ${
                isActive 
                  ? 'bg-primary text-white' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className={`h-6 w-6 shrink-0 ${
                isActive ? 'text-white' : 'text-gray-400 group-hover:text-primary'
              }`} />
              {isExpanded && (
                <span className="text-base font-medium">
                  {item.name}
                </span>
              )}
              {!isExpanded && (
                <div className="absolute left-14 z-10 hidden rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {item.name}
                </div>
              )}
            </Link>
          )
        })}
        
        {/* Lien Administration conditionnel */}
        {isAdmin && (
          <Link
            href="/admin/"
            className={`group relative flex items-center gap-x-3 p-3 rounded-lg ${
              pathname.startsWith('/admin') 
                ? 'bg-primary text-white' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BsGear className={`h-6 w-6 shrink-0 ${
              pathname.startsWith('/admin') ? 'text-white' : 'text-gray-400 group-hover:text-primary'
            }`} />
            {isExpanded && (
              <span className="text-base font-medium">
                Administration
              </span>
            )}
            {!isExpanded && (
              <div className="absolute left-14 z-10 hidden rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                Administration
              </div>
            )}
          </Link>
        )}
      </nav>

      {/* Profil utilisateur et déconnexion */}
      <div className="border-t border-gray-200 p-4">
        {/* Informations utilisateur */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <BsPerson className="h-5 w-5 text-blue-600" />
          </div>
          {isExpanded && user && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          )}
        </div>
        
        {/* Bouton de déconnexion */}
         <button
           onClick={() => signOut()}
           className="group relative flex w-full items-center gap-x-3 p-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600"
         >
          <BsBoxArrowRight className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-red-600" />
          {isExpanded && (
            <span className="text-base font-medium">
              Déconnexion
            </span>
          )}
          {!isExpanded && (
            <div className="absolute left-14 z-10 hidden rounded-md bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
              Déconnexion
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
