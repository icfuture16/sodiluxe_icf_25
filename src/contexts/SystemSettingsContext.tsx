import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface LoyaltyLevelConfig {
  threshold: number // Seuil de points requis pour ce niveau
  rewardRate: number // Taux de récompense en pourcentage (ex: 0.5 pour 0.5%)
}

export interface SystemSettings {
  companyName: string
  contactEmail: string
  contactPhone: string
  taxRate: number
  loyaltyPointsRate: number
  currencySymbol: string
  dateFormat: string
  timeZone: string
  // Paramètres de fidélité par niveau
  loyaltyLevels: {
    bronze: LoyaltyLevelConfig
    silver: LoyaltyLevelConfig
    gold: LoyaltyLevelConfig
  }
}

interface SystemSettingsContextType {
  settings: SystemSettings
  updateSettings: (newSettings: Partial<SystemSettings>) => void
  saveSettings: () => void
}

const defaultSettings: SystemSettings = {
  companyName: 'Sodiluxe',
  contactEmail: 'contact@sodiluxe.com',
  contactPhone: '+221 XX XXX XX XX',
  taxRate: 18,
  loyaltyPointsRate: 0.5, // 0.5 point par euro dépensé par défaut
  currencySymbol: 'FCFA',
  dateFormat: 'DD/MM/YYYY',
  timeZone: 'Africa/Dakar',
  loyaltyLevels: {
    bronze: {
      threshold: 0,
      rewardRate: 0.5 // 0.5% en points
    },
    silver: {
      threshold: 500,
      rewardRate: 0.75 // 0.75% en points + offres spéciales
    },
    gold: {
      threshold: 1000,
      rewardRate: 1.0 // 1% en points + offres VIP
    }
  }
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined)

const STORAGE_KEY = 'sodiluxe_system_settings'

// Fonction pour charger les paramètres depuis localStorage
const loadSettingsFromStorage = (): SystemSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsedSettings = JSON.parse(stored)
      // Fusionner avec les paramètres par défaut pour s'assurer que tous les champs sont présents
      return { ...defaultSettings, ...parsedSettings }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des paramètres:', error)
  }
  return defaultSettings
}

// Fonction pour sauvegarder les paramètres dans localStorage
const saveSettingsToStorage = (settings: SystemSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error)
  }
}

export const SystemSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)

  // Charger les paramètres depuis localStorage au démarrage
  useEffect(() => {
    const loadedSettings = loadSettingsFromStorage()
    setSettings(loadedSettings)
  }, [])

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings }
      // Sauvegarder automatiquement dans localStorage
      saveSettingsToStorage(updatedSettings)
      return updatedSettings
    })
  }

  const saveSettings = () => {
    saveSettingsToStorage(settings)
  }

  return (
    <SystemSettingsContext.Provider value={{ settings, updateSettings, saveSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext)
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}