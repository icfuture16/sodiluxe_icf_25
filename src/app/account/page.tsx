'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { AuthService } from '@/lib/appwrite/auth'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/formatters'
import { Card } from '@/components/ui/card';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { useSellerMonthlyRevenue } from '@/hooks/useSellerSales'

// Types pour les objectifs
export type TaskStatus = 'À faire' | 'En cours' | 'Terminé';

export interface TaskItem {
  id: string; // dnd-kit préfère les ID de type chaîne
  titre: string;
  status: TaskStatus;
}

interface FinancierData {
  objectif: number
  actuel: number
  unite: string
  pourcentage: number
}

interface ObjectifsMensuels {
  $id: string; // ID du document Appwrite
  financier: FinancierData;
  taches: TaskItem[];
  moisEnCours: string;
  utilisateurId: string;
}

// Constante pour la collection d'objectifs Appwrite
const OBJECTIVES_COLLECTION_ID = COLLECTIONS.OBJECTIVES;

export default function AccountPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const [userObjectifs, setUserObjectifs] = useState<ObjectifsMensuels | null>(null)
  
  // Hook pour récupérer le chiffre d'affaires mensuel du vendeur
  const { revenue, salesCount, isLoading: isLoadingRevenue } = useSellerMonthlyRevenue(user?.$id)
  

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
          // Logique de migration pour les anciennes tâches
          const rawTasks = JSON.parse(latestObjective.taches || '[]');
          tachesData = rawTasks.map((task: any, index: number) => ({
            id: task.id?.toString() || `task-${index}`,
            titre: task.titre,
            // Migration de 'complete' vers 'status'
            status: task.status ? task.status : (task.complete ? 'Terminé' : 'À faire')
          }));
        } catch (err) {
          console.error('Erreur lors du parsing des tâches:', err);
          tachesData = [];
        }
        
        setUserObjectifs({
          $id: latestObjective.$id, // Stocker l'ID du document
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

  // Fonction pour sauvegarder les tâches mises à jour dans Appwrite
  const updateTasksInDb = async (updatedTasks: TaskItem[]) => {
    if (!userObjectifs) return;

    try {
      await databases.updateDocument(
        DATABASE_ID,
        OBJECTIVES_COLLECTION_ID,
        userObjectifs.$id, // Utiliser l'ID du document stocké
        { taches: JSON.stringify(updatedTasks) } // Sauvegarder le tableau de tâches mis à jour
      );
      // Mettre à jour l'état local pour refléter le changement
      setUserObjectifs(prev => prev ? { ...prev, taches: updatedTasks } : null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tâches:', error);
      // Optionnel: notifier l'utilisateur de l'échec
    }
  };

  // Charger les objectifs de l'utilisateur connecté
  useEffect(() => {
    if (user) {
      loadUserObjectives();
    }
  }, [user, loadUserObjectives])

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
                <div className="font-medium">{user.name}</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{user.email}</div>
              </div>
              
              {/* Badge du chiffre d'affaires mensuel */}
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-500 mb-2">Chiffre d'affaires du mois</div>
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-lg font-semibold ${
                    isLoadingRevenue 
                      ? 'bg-gray-100 text-gray-600'
                      : (() => {
                          // Déterminer la couleur selon l'objectif financier
                          if (!userObjectifs?.financier?.objectif) {
                            // Pas d'objectif défini, couleur par défaut
                            return 'bg-blue-100 text-blue-800';
                          }
                          
                          const objectif = userObjectifs.financier.objectif;
                          const pourcentage = (revenue / objectif) * 100;
                          
                          if (pourcentage < 30) {
                            // Très faible (moins de 30% de l'objectif) - Rouge
                            return 'bg-red-100 text-red-800';
                          } else if (pourcentage < 100) {
                            // Inférieur à l'objectif - Orange
                            return 'bg-orange-100 text-orange-800';
                          } else {
                            // Supérieur ou égal à l'objectif - Vert
                            return 'bg-green-100 text-green-800';
                          }
                        })()
                  }`}>
                    {isLoadingRevenue ? (
                      <span className="animate-pulse">Chargement...</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(revenue)}</span>
                        {userObjectifs?.financier?.objectif && (
                          <span className="text-xs opacity-75">
                            ({Math.round((revenue / userObjectifs.financier.objectif) * 100)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {!isLoadingRevenue && (
                    <div className="text-sm text-gray-600">
                      {salesCount} vente{salesCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                {/* Indicateur d'objectif */}
                {userObjectifs?.financier?.objectif && !isLoadingRevenue && (
                  <div className="mt-2 text-xs text-gray-500">
                    Objectif: {formatCurrency(userObjectifs.financier.objectif)}
                  </div>
                )}
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
                      {formatCurrency(revenue)} / {formatCurrency(userObjectifs.financier.objectif)}
                    </span>
                  </div>
                  <div className="mb-1">
                    <Progress value={Math.round((revenue / userObjectifs.financier.objectif) * 100)} className="h-2" />
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {Math.round((revenue / userObjectifs.financier.objectif) * 100)}% atteint
                  </div>
                </div>
                
                {/* Tableau de tâches Kanban */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Tâches assignées</h3>
                  {userObjectifs.taches.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">Aucune tâche assignée</p>
                  ) : (
                    <TaskBoard tasks={userObjectifs.taches} onTasksChange={updateTasksInDb} />
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
