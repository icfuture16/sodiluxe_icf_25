'use client'

import { useState, useEffect } from 'react'
import DeveloperAccessModal from '@/components/auth/DeveloperAccessModal'
import { useSystemSettings } from '@/contexts/SystemSettingsContext'
import { useAuth } from '@/providers/AuthProvider'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { AuthUser } from '@/types/appwrite.types'

export default function DeveloperProtectedSettings() {
  const { settings, updateSettings, saveSettings } = useSystemSettings()
  const { user } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AuthUser[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AuthUser | null>(null)
  const [developerPassword, setDeveloperPassword] = useState('')
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false)
  const [isDeveloperVerified, setIsDeveloperVerified] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Vérifier si l'accès développeur a déjà été validé
    const isVerified = localStorage.getItem('developerAccessVerified') === 'true'
    setIsDeveloperVerified(isVerified)
    if (!isVerified) {
      setShowModal(true)
    }
  }, [])

  // Charger les administrateurs quand l'accès développeur est vérifié
  useEffect(() => {
    if (isDeveloperVerified) {
      console.log('✅ Accès développeur vérifié, chargement des administrateurs...')
      loadAdminUsers()
    }
  }, [isDeveloperVerified])

  const loadAdminUsers = async () => {
    try {
      console.log('🔍 Chargement des administrateurs...')
      const response = await fetch('/api/admin/users?role=admin')
      console.log('📡 Réponse API:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Données reçues:', data)
        console.log('👥 Nombre d\'administrateurs trouvés:', data.users?.length || 0)
        setAdminUsers(data.users || [])
      } else {
        console.error('❌ Erreur de réponse API:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('💥 Erreur lors du chargement des administrateurs:', error)
    }
  }

  const handleDeleteAdmin = (admin: AuthUser) => {
    if (admin.$id === user?.$id) {
      toast.error('Vous ne pouvez pas vous supprimer vous-même')
      return
    }
    setSelectedAdmin(admin)
    setShowDeleteModal(true)
  }

  const confirmDeleteAdmin = async () => {
    if (!developerPassword) {
      toast.error('Veuillez saisir le mot de passe développeur')
      return
    }

    setIsDeletingAdmin(true)
    try {
      const response = await fetch(`/api/admin/users/${selectedAdmin?.$id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developerPassword,
          isDeveloperAction: true
        })
      })

      if (response.ok) {
        toast.success('Administrateur supprimé avec succès')
        setShowDeleteModal(false)
        setSelectedAdmin(null)
        setDeveloperPassword('')
        loadAdminUsers()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'administrateur')
    } finally {
      setIsDeletingAdmin(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const processedValue = name === 'taxRate' || name === 'loyaltyPointsRate' ? parseFloat(value) : value
    updateSettings({ [name]: processedValue })
  }

  const handleLoyaltyLevelChange = (level: 'bronze' | 'silver' | 'gold', field: 'threshold' | 'rewardRate', value: string) => {
    const numericValue = parseFloat(value) || 0
    updateSettings({
      loyaltyLevels: {
        ...settings.loyaltyLevels,
        [level]: {
          ...settings.loyaltyLevels[level],
          [field]: numericValue
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Sauvegarder les paramètres dans localStorage
      saveSettings()
      toast.success('Paramètres enregistrés avec succès')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde des paramètres')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerified = () => {
    setIsDeveloperVerified(true)
    setShowModal(false)
  }

  if (showModal) {
    return (
      <DeveloperAccessModal 
        onClose={() => window.history.back()} 
        onVerified={handleVerified}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-secondary">Paramètres Système</h2>
          <p className="text-sm text-gray-500">Configuration globale du système - accès restreint spécialement dédié aux développeurs</p>
        </div>
        <div className="flex items-center">
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <span className="h-2 w-2 bg-red-500 rounded-full mr-1"></span>
            Accès Développeur
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Informations de l'entreprise */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-green-800">Informations de l'entreprise</h3>
            
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={settings.companyName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                  Email de contact
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                  Téléphone de contact
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={settings.contactPhone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          </div>
          
          {/* Paramètres régionaux et TVA */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-blue-800">Paramètres régionaux et TVA</h3>
            
            {/* Grille 2x2 pour les 4 paramètres régionaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ligne du haut : Taux de TVA et Symbole monétaire */}
              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                  Taux de TVA (%)
                </label>
                <input
                  type="number"
                  id="taxRate"
                  name="taxRate"
                  value={settings.taxRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.0001"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              
              <div>
                <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-700">
                  Symbole monétaire
                </label>
                <input
                  type="text"
                  id="currencySymbol"
                  name="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
              
              {/* Ligne du bas : Format de date et Fuseau horaire */}
              <div>
                <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700">
                  Format de date
                </label>
                <select
                  id="dateFormat"
                  name="dateFormat"
                  value={settings.dateFormat}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option key="DD/MM/YYYY" value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option key="MM/DD/YYYY" value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option key="YYYY-MM-DD" value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="timeZone" className="block text-sm font-medium text-gray-700">
                  Fuseau horaire
                </label>
                <select
                  id="timeZone"
                  name="timeZone"
                  value={settings.timeZone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                >
                  <option key="Africa/Dakar" value="Africa/Dakar">Africa/Dakar (GMT+0)</option>
                  <option key="Europe/Paris" value="Europe/Paris">Europe/Paris (GMT+1)</option>
                  <option key="America/New_York" value="America/New_York">America/New_York (GMT-5)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        

        
        {/* Paramètres de Fidélité */}
        <div className="mb-6">
          <h3 className="font-medium text-secondary mb-4">Paramètres de Fidélité</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bronze */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-gradient-to-r from-amber-600 to-amber-800 rounded-full mr-2"></div>
                <h4 className="font-semibold text-amber-800">Bronze</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">
                    Seuil (points)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyaltyLevels.bronze.threshold}
                    onChange={(e) => handleLoyaltyLevelChange('bronze', 'threshold', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-amber-300 rounded focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-amber-700 mb-1">
                    Taux (%)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={settings.loyaltyLevels.bronze.rewardRate}
                    onChange={(e) => handleLoyaltyLevelChange('bronze', 'rewardRate', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-amber-300 rounded focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Argent */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-300 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mr-2"></div>
                <h4 className="font-semibold text-gray-700">Argent</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Seuil (points)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyaltyLevels.silver.threshold}
                    onChange={(e) => handleLoyaltyLevelChange('silver', 'threshold', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Taux (%)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={settings.loyaltyLevels.silver.rewardRate}
                    onChange={(e) => handleLoyaltyLevelChange('silver', 'rewardRate', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Or */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mr-2"></div>
                <h4 className="font-semibold text-yellow-700">Or</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-yellow-600 mb-1">
                    Seuil (points)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={settings.loyaltyLevels.gold.threshold}
                    onChange={(e) => handleLoyaltyLevelChange('gold', 'threshold', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-yellow-600 mb-1">
                    Taux (%)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={settings.loyaltyLevels.gold.rewardRate}
                    onChange={(e) => handleLoyaltyLevelChange('gold', 'rewardRate', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-yellow-300 rounded focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Gestion des Administrateurs */}
        <div className="mb-6">
          <h3 className="font-medium text-secondary mb-4">Gestion des Administrateurs</h3>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
              <h4 className="font-semibold text-red-800">Zone Dangereuse - Suppression d'Administrateurs</h4>
            </div>
            
            <p className="text-sm text-red-700 mb-4">
              Cette section permet de supprimer définitivement des comptes administrateurs. Cette action est irréversible.
            </p>
            
            <div className="space-y-3">
              {adminUsers.length > 0 ? (
                adminUsers.map((admin) => (
                  <div key={admin.$id} className="flex items-center justify-between bg-white border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-semibold text-sm">
                          {admin.name?.[0] || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {admin.name}
                        </p>
                        <p className="text-sm text-gray-500">{admin.email}</p>
                      </div>
                      {admin.$id === user?.$id && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Vous
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleDeleteAdmin(admin)}
                      disabled={admin.$id === user?.$id}
                      className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                      <span className="text-sm">Supprimer</span>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Aucun administrateur trouvé</p>
              )}
            </div>
          </div>
        </div>
        

        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </form>
      
      {/* Modal de confirmation de suppression d'administrateur */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Vous êtes sur le point de supprimer définitivement l'administrateur :
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-medium text-red-900">
                  {selectedAdmin?.name}
                </p>
                <p className="text-sm text-red-700">{selectedAdmin?.email}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label htmlFor="developerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe développeur *
              </label>
              <input
                type="password"
                id="developerPassword"
                value={developerPassword}
                onChange={(e) => setDeveloperPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Saisissez le mot de passe développeur"
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Attention :</strong> Cette action est irréversible. L'administrateur sera définitivement supprimé de la base de données.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedAdmin(null)
                  setDeveloperPassword('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isDeletingAdmin}
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteAdmin}
                disabled={!developerPassword || isDeletingAdmin}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeletingAdmin ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
