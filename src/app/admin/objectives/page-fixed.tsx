'use client'

import { useState, useEffect } from 'react'
import { BsTrash, BsPlus, BsCheckCircleFill, BsXCircleFill, BsSave, BsPerson } from 'react-icons/bs'
import { Suspense } from 'react'
import PageProtection from '@/components/auth/PageProtection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils/formatters'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'


// Type pour les objectifs
interface TaskItem {
  id: number
  titre: string
  complete: boolean
}

interface ObjectifsMensuels {
  financier: {
    objectif: number
    actuel: number
    unite: string
    pourcentage: number
  }
  taches: TaskItem[]
  moisEnCours: string
  utilisateurId: string
}

// Type pour les utilisateurs
interface User {
  $id: string
  name: string
  email: string
  phone?: string
  role?: string
}

// Constantes pour les collections Appwrite
const USERS_COLLECTION_ID = COLLECTIONS.USERS;
const SALES_COLLECTION_ID = COLLECTIONS.SALES;
const OBJECTIVES_COLLECTION_ID = COLLECTIONS.OBJECTIVES;

// Composant principal pour la gestion des objectifs
function ObjectivesContent(): JSX.Element {
  const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }))
  const [financialGoal, setFinancialGoal] = useState(30000)
  const [newTask, setNewTask] = useState('')
  const [monthlySales, setMonthlySales] = useState<{[key: string]: number}>({})
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 1, titre: "Rencontrer 5 nouveaux clients", complete: false },
    { id: 2, titre: "Finaliser la formation produits", complete: true }
  ])
  
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingSales, setIsLoadingSales] = useState(false)
  
  // Charger la liste des utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setIsLoadingUsers(true);
        
        // Récupérer tous les utilisateurs
        const response = await databases.listDocuments(
          DATABASE_ID,
          USERS_COLLECTION_ID
        );
        
        if (response && response.documents) {
          // Utiliser une assertion de type pour corriger l'erreur de typage
          setUsers(response.documents.map(doc => ({
            $id: doc.$id,
            name: doc.name || '',
            email: doc.email || '',
            phone: doc.phone,
            role: doc.role
          })) as User[]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    loadUsers();
  }, [])
  
  // Charger les ventes de l'utilisateur sélectionné pour le mois en cours
  useEffect(() => {
    if (!selectedUserId) return;
    
    const loadUserSales = async () => {
      try {
        setIsLoadingSales(true);
        
        // Obtenir le premier et dernier jour du mois en cours
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const userId = selectedUserId; // Copier l'ID pour éviter des problèmes de closure
        
        // Fonction pour traiter les résultats des ventes
        const processUserSales = (response: any) => {
          let totalSales = 0;
          if (response && response.documents) {
            response.documents.forEach((sale: any) => {
              if (sale.total) {
                totalSales += parseFloat(sale.total);
              }
            });
          }
          
          setMonthlySales(prev => ({
            ...prev,
            [userId]: totalSales
          }));
          
          setIsLoadingSales(false);
        };
        
        // Essayer différents formats possibles pour le champ vendeur
        try {
          // Première tentative: seller.$id
          const response = await databases.listDocuments(
            DATABASE_ID,
            SALES_COLLECTION_ID,
            [
              Query.equal('seller.$id', userId),
              Query.greaterThanEqual('date', firstDayOfMonth.toISOString()),
              Query.lessThanEqual('date', lastDayOfMonth.toISOString())
            ]
          );
          
          processUserSales(response);
        } catch (error) {
          console.log('Tentative avec seller.$id a échoué, essai avec vendeur.$id');
          try {
            // Deuxième tentative: vendeur.$id
            const response = await databases.listDocuments(
              DATABASE_ID,
              SALES_COLLECTION_ID,
              [
                Query.equal('vendeur.$id', userId),
                Query.greaterThanEqual('date', firstDayOfMonth.toISOString()),
                Query.lessThanEqual('date', lastDayOfMonth.toISOString())
              ]
            );
            
            processUserSales(response);
          } catch (error) {
            console.log('Tentative avec vendeur.$id a échoué, essai avec vendeur');
            try {
              // Troisième tentative: vendeur (si c'est juste une référence directe à l'ID)
              const response = await databases.listDocuments(
                DATABASE_ID,
                SALES_COLLECTION_ID,
                [
                  Query.equal('vendeur', userId),
                  Query.greaterThanEqual('date', firstDayOfMonth.toISOString()),
                  Query.lessThanEqual('date', lastDayOfMonth.toISOString())
                ]
              );
              
              processUserSales(response);
            } catch (error) {
              console.error('Toutes les tentatives ont échoué:', error);
              setIsLoadingSales(false);
            }
          }
        }
      } catch (error) {
        console.error('Erreur générale lors du chargement des ventes:', error);
        setIsLoadingSales(false);
      }
    };
    
    loadUserSales();
  }, [selectedUserId])
  
  // Récupérer les ventes actuelles pour un utilisateur
  const getCurrentSales = (userId: string): number => {
    return monthlySales[userId] || 0;
  }
  
  // Calculer le pourcentage de progression
  const calculatePercentage = (userId: string): number => {
    const sales = getCurrentSales(userId);
    return financialGoal > 0 ? Math.min(100, Math.round((sales / financialGoal) * 100)) : 0;
  }
  
  // Ajouter une nouvelle tâche
  const addTask = () => {
    if (!newTask.trim()) return;
    
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    
    setTasks([
      ...tasks,
      { id: newId, titre: newTask, complete: false }
    ]);
    
    setNewTask('');
    setIsSaved(false);
  }
  
  // Supprimer une tâche
  const removeTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
    setIsSaved(false);
  }
  
  // Changer l'état d'une tâche
  const toggleTaskCompletion = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, complete: !task.complete } : task
    ));
    setIsSaved(false);
  }
  
  // Sauvegarder les objectifs dans Appwrite
  const saveObjectives = async () => {
    if (!selectedUserId) {
      alert('Veuillez sélectionner un utilisateur');
      return;
    }
    
    setIsSaving(true);
    setIsSaved(false);
    
    try {
      // Construction de l'objet à sauvegarder
      const currentSales = getCurrentSales(selectedUserId);
      const currentPercentage = calculatePercentage(selectedUserId);
      
      // Préparation de l'objet financier et conversion en chaîne JSON
      const financierData = {
        objectif: financialGoal,
        unite: '€',
        actuel: currentSales,
        pourcentage: currentPercentage
      };
      
      const objectifsToSave = {
        financier: JSON.stringify(financierData),
        taches: JSON.stringify(tasks),
        moisEnCours: currentMonth,
        utilisateurId: selectedUserId,
        dateCreation: new Date().toISOString()
      };
      
      // Vérifier si des objectifs existent déjà pour cet utilisateur ce mois-ci
      const currentMonthYear = new Date().toISOString().substring(0, 7); // Format: YYYY-MM
      
      const existingObjectives = await databases.listDocuments(
        DATABASE_ID,
        OBJECTIVES_COLLECTION_ID,
        [
          Query.equal('utilisateurId', selectedUserId),
          Query.search('moisEnCours', currentMonth)
        ]
      );
      
      let result;
      
      // Mettre à jour ou créer des objectifs
      if (existingObjectives && existingObjectives.documents && existingObjectives.documents.length > 0) {
        // Mettre à jour les objectifs existants
        result = await databases.updateDocument(
          DATABASE_ID,
          OBJECTIVES_COLLECTION_ID,
          existingObjectives.documents[0].$id,
          objectifsToSave
        );
      } else {
        // Créer de nouveaux objectifs
        result = await databases.createDocument(
          DATABASE_ID,
          OBJECTIVES_COLLECTION_ID,
          'unique()',
          objectifsToSave
        );
      }
      
      console.log('Objectifs sauvegardés avec succès:', result);
      setIsSaved(true);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des objectifs:', error);
      alert('Erreur lors de la sauvegarde des objectifs. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-secondary">Gestion des Objectifs</h1>
        <Badge variant="outline" className="text-primary border-primary">{currentMonth}</Badge>
      </div>
      
      {/* Sélection de l'utilisateur */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">Sélectionner un utilisateur</h2>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utilisateur assigné
            </label>
            {isLoadingUsers ? (
              <div className="flex items-center space-x-2 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-gray-500">Chargement des utilisateurs...</span>
              </div>
            ) : (
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Sélectionner un utilisateur --</option>
                {users.map(user => (
                  <option key={user.$id} value={user.$id}>
                    {user.name} {user.role ? `(${user.role})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedUserId && (
            <div className="bg-blue-50 p-3 rounded-md flex items-center">
              <BsPerson className="text-blue-500 mr-2" />
              <div>
                <div className="font-medium">{users.find(u => u.$id === selectedUserId)?.name}</div>
                <div className="text-sm text-gray-500">{users.find(u => u.$id === selectedUserId)?.email}</div>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {selectedUserId && (
        <>
          {/* Objectif financier */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Objectif Financier</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objectif de vente mensuel (FCFA)
                </label>
                <Input
                  type="number"
                  value={financialGoal}
                  onChange={(e) => {
                    setFinancialGoal(Number(e.target.value));
                    setIsSaved(false);
                  }}
                  className="w-full"
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ventes du mois en cours
                  </label>
                  <span className="text-sm text-gray-500">
                    {isLoadingSales ? "Chargement..." : formatCurrency(getCurrentSales(selectedUserId))}
                  </span>
                </div>
                <div className="mb-1">
                  <Progress value={calculatePercentage(selectedUserId)} className="h-2" />
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {calculatePercentage(selectedUserId)}% de l'objectif
                </div>
              </div>
            </div>
          </Card>
          
          {/* Liste de tâches */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Liste de tâches</h2>
            
            {/* Formulaire d'ajout */}
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                placeholder="Ajouter une nouvelle tâche..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                className="flex-1"
              />
              <Button onClick={addTask}>
                <BsPlus className="mr-1" />
                Ajouter
              </Button>
            </div>
            
            {/* Liste des tâches */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucune tâche pour le moment
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className="mr-2"
                      >
                        {task.complete ? (
                          <BsCheckCircleFill className="text-green-500" />
                        ) : (
                          <div className="w-4 h-4 border-2 rounded-full" />
                        )}
                      </button>
                      <span className={task.complete ? "line-through text-gray-500" : ""}>
                        {task.titre}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(task.id)}
                    >
                      <BsTrash className="text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
          
          {/* Actions */}
          <div className="flex justify-end">
            <Button
              onClick={saveObjectives}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <BsSave className="mr-2" />
                  Sauvegarder les objectifs
                </>
              )}
            </Button>
          </div>
          
          {isSaved && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center">
              <BsCheckCircleFill className="text-green-500 mr-2" />
              Les objectifs ont été sauvegardés avec succès.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Page avec suspense pour le chargement
export default function ObjectivesPage() {
  return (
    <PageProtection>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <ObjectivesContent />
      </Suspense>
    </PageProtection>
  );
}
