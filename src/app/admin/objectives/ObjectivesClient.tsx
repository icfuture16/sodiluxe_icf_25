'use client'

import React, { useState, useEffect } from 'react'
import { BsTrash, BsPlus, BsCheckCircleFill, BsXCircleFill, BsSave } from 'react-icons/bs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils/formatters'
// import { databases } from '@/lib/appwrite/config' // Pour l'intégration future avec Appwrite

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
    unité: string
    pourcentage: number
  }
  taches: TaskItem[]
  moisEnCours: string
}

export default function ObjectivesClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }))
  const [financialGoal, setFinancialGoal] = useState(30000)
  const [currentAmount, setCurrentAmount] = useState(0)
  const [newTask, setNewTask] = useState('')
  const [tasks, setTasks] = useState<TaskItem[]>([
    // Tâches par défaut pour l'exemple
    { id: 1, titre: 'Présentation nouvelle collection', complete: false },
    { id: 2, titre: 'Formation produits premium', complete: false }
  ])
  const [isSaved, setIsSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Calculer le pourcentage d'avancement
  const percentage = financialGoal > 0 ? Math.min(Math.round((currentAmount / financialGoal) * 100), 100) : 0

  // Ajouter une nouvelle tâche
  const addTask = () => {
    if (newTask.trim() === '') return

    const newTaskItem: TaskItem = {
      id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      titre: newTask.trim(),
      complete: false
    }

    setTasks([...tasks, newTaskItem])
    setNewTask('')
    setIsSaved(false)
  }

  // Supprimer une tâche
  const removeTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id))
    setIsSaved(false)
  }

  // Changer l'état d'une tâche
  const toggleTaskCompletion = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, complete: !task.complete } : task
    ))
    setIsSaved(false)
  }

  // Sauvegarder les objectifs (simulation pour le moment)
  const saveObjectives = () => {
    setIsSaving(true)
    
    // Simuler une sauvegarde (à remplacer par un appel API réel)
    setTimeout(() => {
      // Construction de l'objet à sauvegarder
      const objectifsToSave: ObjectifsMensuels = {
        financier: {
          objectif: financialGoal,
          actuel: currentAmount,
          unité: '€',
          pourcentage: percentage
        },
        taches: tasks,
        moisEnCours: currentMonth
      }
      
      // Ici, vous implémenteriez la sauvegarde vers Appwrite
      console.log('Sauvegarde des objectifs:', objectifsToSave)
      
      setIsSaved(true)
      setIsSaving(false)
    }, 1000)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-secondary">Gestion des Objectifs</h1>
        <Badge variant="outline" className="text-primary border-primary">{currentMonth}</Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section des objectifs financiers */}
        <Card className="p-6">
          <h2 className="text-xl font-medium mb-4">Objectif financier</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mois et année
              </label>
              <Input 
                type="text" 
                value={currentMonth} 
                onChange={(e) => {
                  setCurrentMonth(e.target.value)
                  setIsSaved(false)
                }}
                placeholder="ex: Juillet 2025" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectif de vente (en FCFA)
              </label>
              <Input 
                type="number" 
                value={financialGoal} 
                onChange={(e) => {
                  setFinancialGoal(parseInt(e.target.value) || 0)
                  setIsSaved(false)
                }}
                placeholder="ex: 30000" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant actuel (en FCFA)
              </label>
              <Input 
                type="number" 
                value={currentAmount} 
                onChange={(e) => {
                  setCurrentAmount(parseInt(e.target.value) || 0)
                  setIsSaved(false)
                }}
                placeholder="ex: 15000" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progression
              </label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {formatCurrency(currentAmount)} / {formatCurrency(financialGoal)}
                </span>
                <span className="text-sm font-medium">{percentage}%</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          </div>
        </Card>
        
        {/* Section des tâches */}
        <Card className="p-6">
          <h2 className="text-xl font-medium mb-4">Tâches mensuelles</h2>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={newTask} 
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Nouvelle tâche..."
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <Button onClick={addTask} size="sm">
                <BsPlus className="w-5 h-5 mr-1" />
                Ajouter
              </Button>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune tâche définie</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => toggleTaskCompletion(task.id)}
                        className="flex-shrink-0"
                      >
                        {task.complete ? (
                          <BsCheckCircleFill className="w-5 h-5 text-green-500" />
                        ) : (
                          <BsXCircleFill className="w-5 h-5 text-gray-300" />
                        )}
                      </button>
                      <span className={task.complete ? 'line-through text-gray-400' : ''}>{task.titre}</span>
                    </div>
                    <button 
                      onClick={() => removeTask(task.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <BsTrash className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="mt-8 flex justify-end">
        <Button 
          onClick={saveObjectives} 
          disabled={isSaving || isSaved}
          className="flex items-center"
        >
          <BsSave className="mr-2" />
          {isSaving ? 'Sauvegarde en cours...' : isSaved ? 'Sauvegardé ✓' : 'Sauvegarder les objectifs'}
        </Button>
      </div>
      
      <div className="mt-8 bg-blue-50 border border-blue-100 rounded-md p-4 text-sm text-blue-800">
        <p className="font-medium">Note d'implémentation</p>
        <p>Ces objectifs et tâches définis seront visibles par tous les employés dans leur section "Mon Compte". 
        Pour l'instant, les données sont stockées localement, mais dans la version finale, 
        elles seront sauvegardées dans la base de données Appwrite.</p>
      </div>
    </div>
  )
}
