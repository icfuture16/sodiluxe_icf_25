'use client'

import { useState, FormEvent, useEffect } from 'react'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { ServiceAfterSale, InterventionHistoryEntry } from './types'
import { FiClock, FiCheckCircle, FiAlertTriangle, FiMessageCircle } from 'react-icons/fi'

interface InterventionTrackingProps {
  sav: ServiceAfterSale
  onUpdate: (updatedSav: ServiceAfterSale) => void
}

export function InterventionTracking({ sav, onUpdate }: InterventionTrackingProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newStatus, setNewStatus] = useState(sav.status)
  const [newComment, setNewComment] = useState('')
  const [newCompletionDate, setNewCompletionDate] = useState(sav.completionDate || '')
  
  // Historique des interventions
  const [interventionHistory, setInterventionHistory] = useState<InterventionHistoryEntry[]>([])
  
  // Initialiser l'historique des interventions localement
  useEffect(() => {
    // Créer une entrée initiale pour l'historique
    const initialEntry: InterventionHistoryEntry = {
      savId: sav.$id,
      date: sav.date,
      action: 'Création de la demande',
      comment: 'Demande SAV créée',
      userName: 'Système'
    }
    
    // Vérifier si l'historique est vide
    if (interventionHistory.length === 0) {
      setInterventionHistory([initialEntry])
    }
    
    // Simuler un chargement rapide
    setTimeout(() => {
      setIsLoading(false)
    }, 300)
  }, [sav.$id, sav.date, interventionHistory.length])
  
  const handleStatusUpdate = async (e: FormEvent) => {
    e.preventDefault()
    
    if (newStatus === sav.status && !newComment && newCompletionDate === (sav.completionDate || '')) {
      return
    }
    
    try {
      setIsUpdating(true)
      
      // Préparer les données à mettre à jour
      const updateData: Record<string, any> = {
        status: newStatus
      }
      
      // Ajouter la date de fin si elle est fournie
      if (newStatus === 'terminée' && newCompletionDate) {
        updateData.completionDate = newCompletionDate
      }
      
      // Mettre à jour la demande SAV dans Appwrite
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.AFTER_SALES_SERVICE,
        sav.$id,
        updateData
      )
      
      // Créer une entrée dans l'historique des interventions (local uniquement)
      const historyEntry: InterventionHistoryEntry = {
        savId: sav.$id,
        $id: `local-${Date.now()}`, // ID local pour l'affichage
        date: new Date().toISOString().split('T')[0],
        action: `Mise à jour du statut: ${newStatus}`,
        comment: newComment || 'Aucun commentaire',
        userName: sav.user_seller || 'Utilisateur' // Utilisateur qui a enregistré le SAV
      }
      
      // Mettre à jour l'historique local
      setInterventionHistory(prev => [historyEntry, ...prev])
      
      // Notifier le composant parent de la mise à jour
      onUpdate(response as unknown as ServiceAfterSale)
      
      // Réinitialiser le formulaire de commentaire
      setNewComment('')
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la demande SAV:', error)
      alert('Une erreur est survenue lors de la mise à jour de la demande')
    } finally {
      setIsUpdating(false)
    }
  }
  
  // Fonction pour obtenir l'icône et la couleur en fonction du statut
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'nouvelle':
        return { icon: <FiClock className="text-blue-500" />, color: 'text-blue-700 bg-blue-100' }
      case 'en_cours':
        return { icon: <FiAlertTriangle className="text-yellow-500" />, color: 'text-yellow-700 bg-yellow-100' }
      case 'terminée':
        return { icon: <FiCheckCircle className="text-green-500" />, color: 'text-green-700 bg-green-100' }
      default:
        return { icon: <FiClock className="text-gray-500" />, color: 'text-gray-700 bg-gray-100' }
    }
  }
  
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium">Suivi des interventions</h3>
      </div>
      
      {/* Statut actuel */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Statut actuel:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusInfo(sav.status).color}`}>
            {sav.status === 'nouvelle' ? 'Nouvelle' : 
             sav.status === 'en_cours' ? 'En cours' : 
             sav.status === 'terminée' ? 'Terminée' : sav.status}
          </span>
        </div>
        
        <div className="mt-2 flex items-center space-x-2">
          <span className="font-medium">Priorité:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold 
            ${sav.priority === 'haute' ? 'text-red-700 bg-red-100' : 
              sav.priority === 'normale' ? 'text-blue-700 bg-blue-100' : 
              'text-green-700 bg-green-100'}`}>
            {sav.priority === 'haute' ? 'Haute' : 
             sav.priority === 'normale' ? 'Normale' : 'Basse'}
          </span>
        </div>
        
        {sav.user_seller && (
          <div className="mt-2">
            <span className="font-medium">Enregistré par:</span> {sav.user_seller}
          </div>
        )}
      </div>
      
      {/* Formulaire de mise à jour */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-md font-medium mb-3">Mettre à jour l'intervention</h4>
        
        <form onSubmit={handleStatusUpdate} className="space-y-4">
          <div>
            <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700">Nouveau statut</label>
            <select
              id="newStatus"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            >
              <option value="nouvelle">Nouvelle</option>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="terminée">Terminée</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>
          
          {newStatus === 'terminée' && (
            <div>
              <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700">Date de fin d'intervention</label>
              <input
                type="date"
                id="completionDate"
                value={newCompletionDate}
                onChange={(e) => setNewCompletionDate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                required={newStatus === 'terminée'}
              />
            </div>
          )}
          
          <div>
            <label htmlFor="newComment" className="block text-sm font-medium text-gray-700">Commentaire</label>
            <textarea
              id="newComment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Ajouter un commentaire sur l'intervention..."
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isUpdating ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Historique des interventions */}
      <div className="p-4">
        <h4 className="text-md font-medium mb-3">Historique des interventions</h4>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : interventionHistory.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            Aucun historique disponible
          </div>
        ) : (
          <div className="space-y-4">
            {interventionHistory.map((entry, index) => (
              <div key={index} className="border-l-4 border-primary pl-4 py-2">
                <div className="flex items-center space-x-2">
                  <FiMessageCircle className="text-primary" />
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-sm text-gray-500">{entry.date}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>
                <p className="text-xs text-gray-500 mt-1">Par: {entry.userName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
