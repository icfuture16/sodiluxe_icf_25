'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BsCalendar3, BsBarChart, BsListCheck } from 'react-icons/bs'
import Planning from './modules/planning/Planning'
import Objectifs from './modules/objectifs/Objectifs'
import Taches from './modules/taches/Taches'
import { useAuth } from '@/providers/AuthProvider'

export default function GestionPersonnelleClient() {
  const [activeTab, setActiveTab] = useState('planning')
  const { user } = useAuth()

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion personnelle</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre planning, vos objectifs et vos tâches quotidiennes
        </p>
      </div>

      {/* Message de bienvenue personnalisé */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle>Bienvenue, {user?.name || "Collaborateur"}</CardTitle>
          <CardDescription>
            Votre espace personnel pour suivre votre activité et vos performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Utilisez les onglets ci-dessous pour accéder aux différentes fonctionnalités 
            de gestion personnelle.
          </p>
        </CardContent>
      </Card>

      {/* Onglets pour les différents modules */}
      <Tabs 
        defaultValue="planning" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3 w-full md:w-auto">
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <BsCalendar3 className="h-4 w-4" />
            <span>Planning</span>
          </TabsTrigger>
          <TabsTrigger value="objectifs" className="flex items-center gap-2">
            <BsBarChart className="h-4 w-4" />
            <span>Objectifs</span>
          </TabsTrigger>
          <TabsTrigger value="taches" className="flex items-center gap-2">
            <BsListCheck className="h-4 w-4" />
            <span>Tâches</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenu des onglets */}
        <TabsContent value="planning" className="space-y-6">
          <Planning />
        </TabsContent>
        
        <TabsContent value="objectifs" className="space-y-6">
          <Objectifs />
        </TabsContent>
        
        <TabsContent value="taches" className="space-y-6">
          <Taches />
        </TabsContent>
      </Tabs>
    </div>
  )
}
