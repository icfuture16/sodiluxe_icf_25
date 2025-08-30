'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useStores } from '@/hooks'
import { useAuth } from '@/providers/AuthProvider'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

// Types pour les tâches
type TaskPriority = 'haute' | 'moyenne' | 'basse'

type Task = {
  id: string
  title: string
  description?: string
  completed: boolean
  storeId: string
  priority: TaskPriority
  assignedTo?: string
  category: 'ouverture' | 'journée' | 'fermeture' | 'hebdomadaire'
}

// Données de démo pour les tâches
const demoTasks: Task[] = [
  {
    id: 't1',
    title: 'Vérifier la caisse',
    description: 'Compter la caisse et s\'assurer que le montant correspond',
    completed: false,
    storeId: 'store1',
    priority: 'haute',
    category: 'ouverture'
  },
  {
    id: 't2',
    title: 'Réapprovisionner les présentoirs',
    description: 'Remettre des produits sur les présentoirs vides',
    completed: false,
    storeId: 'store1',
    priority: 'moyenne',
    category: 'journée'
  },
  {
    id: 't3',
    title: 'Nettoyer les vitrines',
    description: 'Enlever les traces de doigts et la poussière',
    completed: true,
    storeId: 'store1',
    priority: 'basse',
    category: 'journée'
  },
  {
    id: 't4',
    title: 'Fermer la caisse',
    description: 'Compter la caisse, préparer le dépôt',
    completed: false,
    storeId: 'store1',
    priority: 'haute',
    category: 'fermeture'
  },
  {
    id: 't5',
    title: 'Inventaire hebdomadaire',
    description: 'Faire l\'inventaire des produits en rupture',
    completed: false,
    storeId: 'store1',
    priority: 'haute',
    category: 'hebdomadaire'
  }
]

// Composant pour afficher une tâche
function TaskItem({ task, onComplete, onDelete }: { 
  task: Task, 
  onComplete: (id: string, completed: boolean) => void,
  onDelete: (id: string) => void
}) {
  const priorityColors = {
    'haute': 'border-red-200 bg-red-50',
    'moyenne': 'border-amber-200 bg-amber-50',
    'basse': 'border-blue-200 bg-blue-50'
  }
  
  return (
    <div className={`p-4 rounded-md border flex items-start gap-3 ${priorityColors[task.priority]}`}>
      <Checkbox 
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={(checked) => onComplete(task.id, checked as boolean)}
        className="mt-1"
      />
      <div className="flex-1">
        <label 
          htmlFor={`task-${task.id}`}
          className={`font-medium block ${task.completed ? 'line-through text-gray-500' : ''}`}
        >
          {task.title}
        </label>
        {task.description && (
          <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.description}
          </p>
        )}
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        className="text-gray-400 hover:text-red-500"
        onClick={() => onDelete(task.id)}
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default function Taches() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks)
  const [selectedStore, setSelectedStore] = useState<string>('store1')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'moyenne' as TaskPriority,
    category: 'journée' as 'ouverture' | 'journée' | 'fermeture' | 'hebdomadaire'
  })
  
  const { data: stores, isLoading } = useStores()
  const { user } = useAuth()
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })
  
  // Marquage d'une tâche comme complétée ou non
  const handleCompleteTask = (id: string, completed: boolean) => {
    setTasks((prev) => 
      prev.map((task) => 
        task.id === id ? { ...task, completed } : task
      )
    )
    
    toast({
      title: completed ? "Tâche terminée" : "Tâche à refaire",
      description: `La tâche a été marquée comme ${completed ? 'terminée' : 'à faire'}`,
      variant: "default",
    })
  }
  
  // Suppression d'une tâche
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
    
    toast({
      title: "Tâche supprimée",
      description: "La tâche a été supprimée avec succès",
      variant: "destructive",
    })
  }
  
  // Création d'une nouvelle tâche
  const handleCreateTask = () => {
    if (!newTask.title.trim()) {
      toast({
        title: "Erreur",
        description: "Le titre de la tâche est requis",
        variant: "destructive",
      })
      return
    }
    
    const task: Task = {
      id: `t${Date.now()}`,
      title: newTask.title,
      description: newTask.description || undefined,
      completed: false,
      storeId: selectedStore,
      priority: newTask.priority,
      category: newTask.category
    }
    
    setTasks((prev) => [...prev, task])
    setNewTaskOpen(false)
    setNewTask({
      title: '',
      description: '',
      priority: 'moyenne',
      category: 'journée'
    })
    
    toast({
      title: "Tâche créée",
      description: "La nouvelle tâche a été ajoutée avec succès",
      variant: "default",
    })
  }
  
  // Filtrage des tâches par boutique et catégorie
  const filteredTasks = tasks.filter((task) => {
    const storeMatch = selectedStore === 'all' || task.storeId === selectedStore
    const categoryMatch = selectedCategory === 'all' || task.category === selectedCategory
    return storeMatch && categoryMatch
  })
  
  // Comptage des tâches par statut
  const taskStats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.completed).length,
    remaining: filteredTasks.filter(t => !t.completed).length
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Tâches journalières</h2>
          <p className="text-muted-foreground mt-1">{today}</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {!isLoading && stores && (
            <Select
              value={selectedStore}
              onValueChange={setSelectedStore}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sélectionner une boutique" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les boutiques</SelectItem>
                {stores.map((store: any) => (
                  <SelectItem key={store.$id} value={store.$id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les tâches</SelectItem>
              <SelectItem value="ouverture">Ouverture</SelectItem>
              <SelectItem value="journée">Journée</SelectItem>
              <SelectItem value="fermeture">Fermeture</SelectItem>
              <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1">
                <PlusIcon className="h-4 w-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle tâche</DialogTitle>
                <DialogDescription>
                  Créez une nouvelle tâche pour la boutique sélectionnée
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Titre
                  </Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Titre de la tâche"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Description (optionnelle)"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="priority" className="text-right">
                    Priorité
                  </Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: TaskPriority) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger id="priority" className="col-span-3">
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="basse">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Catégorie
                  </Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(value: any) => setNewTask({ ...newTask, category: value })}
                  >
                    <SelectTrigger id="category" className="col-span-3">
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ouverture">Ouverture</SelectItem>
                      <SelectItem value="journée">Journée</SelectItem>
                      <SelectItem value="fermeture">Fermeture</SelectItem>
                      <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewTaskOpen(false)}>Annuler</Button>
                <Button onClick={handleCreateTask}>Créer la tâche</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Statistiques des tâches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-blue-600">Total des tâches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-green-600">Tâches complétées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskStats.completed}</div>
            <div className="text-sm text-muted-foreground">
              {taskStats.total > 0 
                ? `${Math.round((taskStats.completed / taskStats.total) * 100)}% du total` 
                : 'Aucune tâche'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-amber-600">Tâches restantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taskStats.remaining}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Liste des tâches par catégorie */}
      <div className="grid gap-6">
        {(selectedCategory === 'all' || selectedCategory === 'ouverture') && (
          <Card>
            <CardHeader>
              <CardTitle>Tâches d'ouverture</CardTitle>
              <CardDescription>À effectuer en début de journée</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTasks
                .filter(task => task.category === 'ouverture')
                .map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              }
              {filteredTasks.filter(task => task.category === 'ouverture').length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune tâche d'ouverture pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {(selectedCategory === 'all' || selectedCategory === 'journée') && (
          <Card>
            <CardHeader>
              <CardTitle>Tâches de la journée</CardTitle>
              <CardDescription>À effectuer pendant les heures d'ouverture</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTasks
                .filter(task => task.category === 'journée')
                .map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              }
              {filteredTasks.filter(task => task.category === 'journée').length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune tâche pour la journée
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {(selectedCategory === 'all' || selectedCategory === 'fermeture') && (
          <Card>
            <CardHeader>
              <CardTitle>Tâches de fermeture</CardTitle>
              <CardDescription>À effectuer en fin de journée</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTasks
                .filter(task => task.category === 'fermeture')
                .map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              }
              {filteredTasks.filter(task => task.category === 'fermeture').length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune tâche de fermeture pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {(selectedCategory === 'all' || selectedCategory === 'hebdomadaire') && (
          <Card>
            <CardHeader>
              <CardTitle>Tâches hebdomadaires</CardTitle>
              <CardDescription>À effectuer une fois par semaine</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredTasks
                .filter(task => task.category === 'hebdomadaire')
                .map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onComplete={handleCompleteTask}
                    onDelete={handleDeleteTask}
                  />
                ))
              }
              {filteredTasks.filter(task => task.category === 'hebdomadaire').length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune tâche hebdomadaire pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
