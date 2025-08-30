'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { AuthService } from '@/lib/appwrite/auth'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/formatters'
import { Card } from '@/components/ui/card'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'

// Types pour les objectifs
interface TaskItem {
  id: number
  titre: string
  complete: boolean
}

interface FinancierData {
  objectif: number
  actuel: number
  unite: string
  pourcentage: number
}

interface ObjectifsMensuels {
  financier: FinancierData
  taches: TaskItem[]
  moisEnCours: string
  utilisateurId: string
}

// Constante pour la collection d'objectifs Appwrite
const OBJECTIVES_COLLECTION_ID = COLLECTIONS.OBJECTIVES;

export default function AccountPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userObjectifs, setUserObjectifs] = useState<ObjectifsMensuels | null>(null)
  
  const loadUserProfile = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const authService = new AuthService()
      const profile = await authService.getUserProfile(user.$id)
      setUserProfile(profile)
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Fonction pour charger les objectifs de l'utilisateur depuis Appwrite
  const loadUserObjectives = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Récupérer les objectifs de l'utilisateur connecté
      const response = await databases.listDocuments(
        DATABASE_ID,
        OBJECTIVES_COLLECTION_ID,
        [Query.equal('utilisateurId', user.$id)]
      );
      
      if (response && response.documents && response.documents.length > 0) {
        // Prendre l'objectif le plus récent pour l'utilisateur
        const latestObjective = response.documents[0];
        
        // Parser les attributs JSON stockés sous forme de chaînes
        let financierData: FinancierData;
        let tachesData: TaskItem[];
        
        try {
          financierData = JSON.parse(latestObjective.financier || '{}');
        } catch (err) {
          console.error('Erreur lors du parsing des données financières:', err);
          financierData = {
            objectif: 0,
            actuel: 0,
            unite: '€',
            pourcentage: 0
          };
        }
        
        try {
          tachesData = JSON.parse(latestObjective.taches || '[]');
        } catch (err) {
          console.error('Erreur lors du parsing des tâches:', err);
          tachesData = [];
        }
        
        setUserObjectifs({
          financier: financierData,
          taches: tachesData,
          moisEnCours: latestObjective.moisEnCours || '',
          utilisateurId: latestObjective.utilisateurId
        });
      } else {
        // Aucun objectif trouvé pour cet utilisateur
        setUserObjectifs(null);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
      setUserObjectifs(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger le profil et les objectifs de l'utilisateur connecté
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserObjectives();
    }
  }, [user, loadUserProfile, loadUserObjectives])

  if (!user) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Mon Compte</h1>
        <Card className="p-6">
          <p className="text-center py-8 text-gray-500">
            Veuillez vous connecter pour voir votre compte.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Mon Compte</h1>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Informations du profil */}
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">Informations Personnelles</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Nom</div>
                <div className="font-medium">{userProfile?.name || user.name}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{userProfile?.email || user.email}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Téléphone</div>
                <div className="font-medium">{userProfile?.phone || "Non renseigné"}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Rôle</div>
                <Badge className="mt-1">{userProfile?.role || "Utilisateur"}</Badge>
              </div>
            </div>
          </Card>
          
          {/* Objectifs mensuels */}
          <Card className="p-6">
            <h2 className="text-xl font-medium mb-4">
              Mes Objectifs
              {userObjectifs?.moisEnCours && (
                <Badge variant="outline" className="ml-2">
                  {userObjectifs.moisEnCours}
                </Badge>
              )}
            </h2>
            
            {userObjectifs ? (
              <div className="space-y-6">
                {/* Objectif financier */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Objectif financier</span>
                    <span>
                      {formatCurrency(userObjectifs.financier.actuel)} / {formatCurrency(userObjectifs.financier.objectif)}
                    </span>
                  </div>
                  <div className="mb-1">
                    <Progress value={userObjectifs.financier.pourcentage} className="h-2" />
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {userObjectifs.financier.pourcentage}% atteint
                  </div>
                </div>
                
                {/* Liste de tâches */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Tâches assignées</h3>
                  {userObjectifs.taches.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Aucune tâche assignée</p>
                  ) : (
                    <div className="space-y-2">
                      {userObjectifs.taches.map(task => (
                        <div key={task.id} className="flex items-center border-b pb-2">
                          <div className={`w-4 h-4 mr-3 rounded-full ${task.complete ? 'bg-green-500' : 'border-2 border-gray-300'}`}></div>
                          <span className={task.complete ? "line-through text-gray-500" : ""}>
                            {task.titre}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-gray-500">
                Aucun objectif défini pour le mois en cours.
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
