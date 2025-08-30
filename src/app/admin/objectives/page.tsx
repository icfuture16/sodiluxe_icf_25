'use client'

import { useState, useEffect } from 'react'
import { Permission, Role } from 'appwrite'
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
import { databases, account, teams, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'
import { useSellerMonthlyRevenue } from '@/hooks/useSellerSales'
import { Models } from 'appwrite'


// Type pour les objectifs
type TaskStatus = 'À faire' | 'Terminé'
interface TaskItem {
  id: number
  titre: string
  status: TaskStatus
  complete?: boolean // pour compatibilité Appwrite, mais non utilisé côté UI
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
  // Toutes les tâches historiques de l'utilisateur sélectionné
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [allObjectives, setAllObjectives] = useState<any[]>([]); // Document[] d'Appwrite
  const [tasks, setTasks] = useState<TaskItem[]>([]); // Tâches du mois courant
  const [oldTasks, setOldTasks] = useState<TaskItem[]>([]); // Anciennes tâches
  
  // Hook pour récupérer le chiffre d'affaires mensuel du vendeur sélectionné
  const { revenue, salesCount, isLoading: isLoadingRevenue } = useSellerMonthlyRevenue(selectedUserId)

  // Charger tous les objectifs pour l'utilisateur sélectionné
  useEffect(() => {
    if (!selectedUserId) return;
    databases.listDocuments(
      DATABASE_ID,
      OBJECTIVES_COLLECTION_ID,
      [Query.equal('utilisateurId', selectedUserId)]
    ).then(res => {
      setAllObjectives(res.documents || []);
      // Séparer tâches du mois courant et anciennes tâches
      const current = res.documents.find((obj: any) => obj.moisEnCours === currentMonth);
      const old = res.documents.filter((obj: any) => obj.moisEnCours !== currentMonth);
      let currentTasks: TaskItem[] = [];
      let previousTasks: TaskItem[] = [];
      
      if (current) {
        try {
          currentTasks = JSON.parse(current.taches || '[]').map((task: any, idx: number) => ({
            id: typeof task.id === 'number' ? task.id : idx + 1,
            titre: task.titre,
            status: task.status ? task.status : (task.complete ? 'Terminé' : 'À faire')
          }));
        } catch { currentTasks = []; }
        
        // Charger l'objectif financier existant
        try {
          const financierData = JSON.parse(current.financier || '{}');
          if (financierData.objectif) {
            setFinancialGoal(financierData.objectif);
          }
        } catch { /* Ignorer les erreurs de parsing */ }
      } else {
        // Réinitialiser l'objectif financier si aucun objectif n'existe pour ce mois
        setFinancialGoal(30000);
      }
      
      old.forEach((obj: any) => {
        try {
          previousTasks = previousTasks.concat(
            JSON.parse(obj.taches || '[]').map((task: any, idx: number) => ({
              id: typeof task.id === 'number' ? task.id : idx + 1,
              titre: task.titre,
              status: task.status ? task.status : (task.complete ? 'Terminé' : 'À faire')
            }))
          );
        } catch {}
      });
      setTasks(currentTasks);
      setOldTasks(previousTasks);
    });
  }, [selectedUserId, currentMonth]);
  

  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  
  // Vérifier le statut de l'utilisateur et charger les données
  useEffect(() => {
    const checkUserStatusAndLoadData = async () => {
      try {
        const user = await account.get();
        console.log('DEBUG: User Authenticated:', user);

        const teamsList = await teams.list();
        console.log('DEBUG: Teams List:', teamsList);

        const adminTeam = teamsList.teams.find((team: Models.Team<Models.Preferences>) => team.name.toLowerCase() === 'admin');
        console.log('DEBUG: Admin Team Found:', adminTeam);
        
        let userIsAdmin = false;
        if (adminTeam) {
          const memberships = await teams.listMemberships(adminTeam.$id);
          console.log('DEBUG: Memberships in Admin Team:', memberships);
          if (memberships.memberships.some((m: Models.Membership) => m.userId === user.$id)) {
            userIsAdmin = true;
          }
        }
        console.log('DEBUG: Is User Admin?', userIsAdmin);

        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
            // Si admin, charger tous les utilisateurs depuis la collection Users
            try {
              const usersResponse = await databases.listDocuments(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                [Query.limit(100)]
              );
              setUsers(usersResponse.documents.map((u: any) => ({
                 $id: u.$id,
                 name: u.fullName || u.name || '',
                 email: u.email || '',
                 phone: u.phone || '',
                 role: u.role || 'user'
               })) as User[]);
             } catch (usersError) {
               console.error('Erreur lors du chargement des utilisateurs:', usersError);
               setUsers([]);
             }
        } else {
          // Si non-admin, utiliser directement les informations de l'utilisateur connecté
          const currentUserData = {
              $id: user.$id,
              name: user.name || '',
              email: user.email || '',
              phone: user.phone || '',
              role: 'user' // ou un rôle par défaut si non défini
          } as User;
          setUsers([currentUserData]);
          setSelectedUserId(user.$id);
        }

      } catch (error) {
        console.error('Erreur lors de la vérification du statut utilisateur:', error);
      } finally {
        setIsCheckingAuth(false);
        setIsLoadingUsers(false);
      }
    };

    checkUserStatusAndLoadData();
  }, [])


  
  // Charger les détails de l'utilisateur sélectionné
  const handleUserChange = async (userId: string) => {
    setSelectedUserId(userId);
    setIsSaved(true); // Réinitialiser le statut de sauvegarde
    
    // Vérifier si l'utilisateur existe dans la collection users
    try {
      await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId
      ); // Si pas d'erreur, rien à faire
    } catch (error: any) {
      if (error?.code === 404) {
        // Créer un document profil minimal pour cet utilisateur
        try {
          // Chercher l'utilisateur dans la liste users chargée en mémoire (state)
          const selectedUser = users.find(u => u.$id === userId);
          if (selectedUser) {
            const { ID, Query } = await import('appwrite');
            // Récupérer le premier magasin existant pour affecter le user
            const storesResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.STORES,
              [Query.limit(1)]
            );
            const defaultStoreId = storesResponse.documents[0]?.$id;
            if (!defaultStoreId) {
              alert("Aucune boutique n'existe. Impossible de créer le profil utilisateur tant qu'une boutique n'est pas créée.");
              return;
            }
            // Assertion TypeScript : defaultStoreId est garanti string ici
            const safeStoreId: string = defaultStoreId;
            // Vérifier si un profil existe déjà (par email)
            const existingProfiles = await databases.listDocuments(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              [Query.equal('email', [selectedUser.email])]
            );
            if (existingProfiles.total > 0) {
              alert('Un profil existe déjà pour cet utilisateur.');
              return;
            }
            // Rôle par défaut conforme à l'enum
            const allowedRoles = ['admin', 'manager', 'seller'] as const;
            let role: 'admin' | 'manager' | 'seller';
            if (allowedRoles.includes(selectedUser.role as any)) {
              role = selectedUser.role as 'admin' | 'manager' | 'seller';
            } else {
              role = 'seller'; // Par défaut, tous les nouveaux users sont des vendeurs
            }
            await databases.createDocument(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              ID.unique(),
              {
                email: selectedUser.email || '',
                fullName: selectedUser.name || '',
                role,
                storeId: safeStoreId,
              }
            );
            // Note : le storeId et le role sont modifiables ensuite via /admin/users
            // Optionnel: afficher un toast/success
            // alert('Profil utilisateur créé automatiquement.');
          } else {
            alert('Impossible de créer le profil utilisateur : informations manquantes.');
          }
        } catch (createError) {
          alert('Erreur lors de la création automatique du profil utilisateur.');
        }
      } else {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
      }
    }
  };

  // Calculer le pourcentage de progression
  const calculatePercentage = (): number => {
    return financialGoal > 0 ? Math.min(100, Math.round((revenue / financialGoal) * 100)) : 0;
  }

  // Vérifier si l'objectif est atteint et afficher une notification
  useEffect(() => {
    if (!selectedUserId || !revenue || !financialGoal || isLoadingRevenue) return;
    
    const percentage = calculatePercentage();
    if (percentage >= 100) {
      const selectedUser = users.find(user => user.$id === selectedUserId);
      const userName = selectedUser?.name || 'Utilisateur';
      setNotificationMessage(`🎉 Félicitations ! ${userName} a atteint son objectif financier du mois !`);
      setShowNotification(true);
      
      // Masquer la notification après 5 secondes
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    }
  }, [revenue, financialGoal, selectedUserId, users, isLoadingRevenue]);
  
  // Ajouter une nouvelle tâche
  const addTask = () => {
    if (!newTask.trim()) return;
    
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    
    setTasks([
      ...tasks,
      { id: newId, titre: newTask, status: 'À faire' as TaskStatus, complete: false }
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
    // Vérifier que l'utilisateur existe dans Appwrite
    let userExists = false;
    try {
      await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        selectedUserId
      );
      userExists = true;
    } catch (userError: any) {
      if (userError?.code === 404) {
        // Création automatique du profil utilisateur minimal
        try {
          // Chercher l'utilisateur dans la liste users chargée en mémoire (state)
          const selectedUser = users.find(u => u.$id === selectedUserId);
          if (selectedUser) {
            // Récupérer le premier magasin existant pour affecter le user
            const storesResponse = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.STORES,
              [Query.limit(1)]
            );
            const defaultStoreId = storesResponse.documents[0]?.$id;
            if (!defaultStoreId) {
              alert("Aucune boutique n'existe. Impossible de créer le profil utilisateur tant qu'une boutique n'est pas créée.");
              setIsSaving(false);
              return;
            }
            // Vérifier si un profil existe déjà (par email)
            const existingProfiles = await databases.listDocuments(
              DATABASE_ID,
              USERS_COLLECTION_ID,
              [Query.equal('email', [selectedUser.email])]
            );
            if (existingProfiles.total > 0) {
              // Profil déjà existant, on peut continuer
              userExists = true;
            } else {
              // Créer le profil minimal
              const allowedRoles = ['admin', 'manager', 'seller'] as const;
              let role: 'admin' | 'manager' | 'seller';
              if (allowedRoles.includes(selectedUser.role as any)) {
                role = selectedUser.role as 'admin' | 'manager' | 'seller';
              } else {
                role = 'seller';
              }
              await databases.createDocument(
                DATABASE_ID,
                USERS_COLLECTION_ID,
                selectedUserId,
                {
                  email: selectedUser.email || '',
                  fullName: selectedUser.name || '',
                  role,
                  storeId: defaultStoreId,
                }
              );
              userExists = true;
            }
          } else {
            alert('Impossible de créer le profil utilisateur : informations manquantes.');
            setIsSaving(false);
            return;
          }
        } catch (createError) {
          alert('Erreur lors de la création automatique du profil utilisateur.');
          setIsSaving(false);
          return;
        }
      } else {
        alert('Erreur lors de la vérification de l\'utilisateur.');
        setIsSaving(false);
        return;
      }
    }

    // Construction de l'objet à sauvegarder
    const financierData = {
      objectif: financialGoal,
      unite: 'Fcfa',
      actuel: revenue,
      pourcentage: calculatePercentage()
    };
    const objectifsToSave = {
      financier: JSON.stringify(financierData),
      taches: JSON.stringify(tasks.map(task => ({
        ...task,
        complete: task.status === 'Terminé'
      }))),
      moisEnCours: currentMonth,
      utilisateurId: selectedUserId,
      dateCreation: new Date().toISOString()
    };

    // Vérifier si des objectifs existent déjà pour cet utilisateur ce mois-ci
    const existingObjectives = await databases.listDocuments(
      DATABASE_ID,
      OBJECTIVES_COLLECTION_ID,
      [
        Query.equal('utilisateurId', selectedUserId),
        Query.equal('moisEnCours', currentMonth)
      ]
    );

    let result;
    if (existingObjectives && existingObjectives.documents && existingObjectives.documents.length > 0) {
      // Mettre à jour les objectifs existants
      result = await databases.updateDocument(
        DATABASE_ID,
        OBJECTIVES_COLLECTION_ID,
        existingObjectives.documents[0].$id,
        objectifsToSave
      );
      console.log('Objectifs mis à jour avec succès:', result);
      setIsSaved(true);
    } else {
      // Créer de nouveaux objectifs avec fallback automatique sur les permissions
      try {
        result = await databases.createDocument(
          DATABASE_ID,
          OBJECTIVES_COLLECTION_ID,
          'unique()',
          objectifsToSave,
          [
            Permission.read(Role.user(selectedUserId)),
            Permission.update(Role.user(selectedUserId))
          ]
        );
        console.log('Objectifs créés avec permissions utilisateur:', result);
        setIsSaved(true);
      } catch (err) {
        console.warn('Erreur permissions lors de la création, tentative sans permissions explicites:', err);
        try {
          result = await databases.createDocument(
            DATABASE_ID,
            OBJECTIVES_COLLECTION_ID,
            'unique()',
            objectifsToSave
            // Pas de tableau de permissions => permissions par défaut de la collection
          );
          console.log('Objectifs créés avec permissions par défaut de la collection:', result);
          setIsSaved(true);
        } catch (err2) {
          console.error('Erreur finale lors de la sauvegarde des objectifs:', err2);
          alert('Erreur lors de la sauvegarde des objectifs. Veuillez vérifier vos droits ou contacter un administrateur.');
        }
      }
    }
  } catch (error) {
    console.error('Erreur générale lors de la sauvegarde des objectifs:', error);
    alert('Erreur lors de la sauvegarde des objectifs. Veuillez réessayer.');
  } finally {
    setIsSaving(false);
  }
}


  if (isCheckingAuth) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-4 text-gray-500">Vérification des autorisations...</span>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-secondary">Gestion des Objectifs</h1>
        <Badge variant="outline" className="text-primary border-primary">{currentMonth}</Badge>
      </div>
      
      {/* Notification d'objectif atteint */}
      {showNotification && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between animate-pulse">
          <span className="font-medium">{notificationMessage}</span>
          <button 
            onClick={() => setShowNotification(false)}
            className="ml-4 text-green-700 hover:text-green-900 font-bold text-xl"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Sélection de l'utilisateur (Admin seulement) */}
      {isAdmin && (
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
                  onChange={(e) => handleUserChange(e.target.value)}
                  disabled={!isAdmin}
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
      )}
      
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
                  disabled={!isAdmin}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ventes du mois en cours
                  </label>
                  <span className="text-sm text-gray-500">
                    {isLoadingRevenue ? "Chargement..." : formatCurrency(revenue)}
                  </span>
                </div>
                <div className="mb-1">
                  <Progress value={calculatePercentage()} className="h-2" />
                </div>
                <div className="text-xs text-gray-500 text-right">
                  {calculatePercentage()}% de l'objectif
                </div>
              </div>
            </div>
          </Card>
          
          {/* Liste de tâches */}
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-medium mb-4">Tâches du mois courant</h2>
            {/* Formulaire d'ajout (Admin seulement) */}
            {isAdmin && (
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
            )}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Aucune tâche pour le moment
                </div>
              ) : (
                tasks.map((task, idx) => (
                  <div key={task.id} className={`flex items-center justify-between border-b pb-2 ${task.status === 'Terminé' ? 'bg-green-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.status === 'Terminé'}
                        onChange={() => setTasks(tasks => tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'Terminé' ? 'À faire' : 'Terminé' } : t))}
                        disabled={!isAdmin}
                        className="accent-green-500 h-4 w-4"
                      />
                      {isAdmin ? (
                        <input
                          className={`border-b w-64 bg-transparent ${task.status === 'Terminé' ? 'line-through text-gray-500 bg-green-50' : ''}`}
                          value={task.titre}
                          onChange={e => setTasks(tasks => tasks.map(t => t.id === task.id ? { ...t, titre: e.target.value } : t))}
                        />
                      ) : (
                        <span className={task.status === 'Terminé' ? "line-through text-gray-500" : ""}>{task.titre}</span>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTasks(tasks => tasks.filter(t => t.id !== task.id))}
                      >
                        <BsTrash className="text-red-500" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
            
          </Card>

          {/* Bloc anciennes tâches avec option de reprise */}
          {oldTasks.length > 0 && (
            <Card className="p-6 mb-6 bg-gray-50">
              <h2 className="text-lg font-medium mb-4 text-gray-700">Anciennes tâches</h2>
              <div className="space-y-2">
                {oldTasks.map((task, idx) => (
                  <div key={task.id + '-' + idx} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.status === 'Terminé'}
                        readOnly
                        className="accent-green-500 h-4 w-4"
                      />
                      <span className={task.status === 'Terminé' ? "line-through text-gray-500" : ""}>{task.titre}</span>
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTasks(tasks => [...tasks, { ...task, id: Date.now() + Math.floor(Math.random()*1000) }])}
                      >
                        Reprendre dans le mois courant
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          
          {/* Actions (Admin seulement) */}
          {isAdmin && (
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
          )}
          
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
