'use client'

import { useEffect, useState } from 'react'
import './dashboard.css'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [screenSize, setScreenSize] = useState<string>('desktop')

  useEffect(() => {
    // Fonction pour déterminer la taille de l'écran
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else if (width < 1280) {
        setScreenSize('desktop')
      } else {
        setScreenSize('wide')
      }
    }

    // Appel initial
    handleResize()

    // Ajouter l'écouteur d'événement
    window.addEventListener('resize', handleResize)

    // Nettoyer l'écouteur d'événement
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div 
      className={`dashboard-container dashboard-${screenSize}`}
      data-testid="dashboard-layout"
    >
      {children}
    </div>
  )
}

export default DashboardLayout
