'use client'

import { useState, useEffect } from 'react'
import { BsHeadset, BsClipboardCheck, BsTools, BsExclamationTriangle, BsClock, BsPeople, BsSearch } from 'react-icons/bs'
import { databases, DATABASE_ID } from '@/lib/appwrite/client'
import { Query } from 'appwrite'
import PageProtection from '@/components/auth/PageProtection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Types pour le module SAV
interface ServiceRequest {
  $id: string
  date: string
  store_id: string
  store_name: string
  client_id: string
  client_name: string
  product_id: string
  product_name: string
  issue_type: 'réparation' | 'échange' | 'remboursement' | 'autre'
  issue_description: string
  status: 'nouvelle' | 'en_attente' | 'en_cours' | 'terminée' | 'annulée'
  priority: 'high' | 'medium' | 'low'
  user_seller?: string
  estimated_completion_date?: string
  completion_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface ServiceRequestFormData {
  store_id: string
  store_name: string
  client_id: string
  client_name: string
  product_id: string
  product_name: string
  issue_type: 'réparation' | 'échange' | 'remboursement' | 'autre'
  issue_description: string
  priority: 'high' | 'medium' | 'low'
  estimated_completion_date?: string
}

export default function SavClient() {
  const [activeTab, setActiveTab] = useState('new')
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [issueType, setIssueType] = useState<'réparation' | 'échange' | 'remboursement' | 'autre'>('réparation');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  
  useEffect(() => {
    fetchServiceRequests()
  }, [])
  
  const fetchServiceRequests = async () => {
    setIsLoading(true)
    try {
      // Simulation de données pour l'instant
      const demoData: ServiceRequest[] = [
        {
          $id: '1',
          date: new Date().toISOString(),
          store_id: '1',
          store_name: 'Sillage Almadies',
          client_id: '101',
          client_name: 'Fatou Diop',
          product_id: 'p101',
          product_name: 'Montre Guess GW0365L1',
          issue_type: 'réparation',
          issue_description: 'Verre fissuré, besoin de remplacement',
          status: 'en_cours',
          priority: 'high',
          user_seller: 'MSene',
          estimated_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          $id: '2',
          date: new Date().toISOString(),
          store_id: '2',
          store_name: 'Gemaber Sea Plaza',
          client_id: '102',
          client_name: 'Amadou Diallo',
          product_id: 'p202',
          product_name: 'Bracelet Pandora',
          issue_type: 'échange',
          issue_description: 'Mauvaise taille',
          status: 'nouvelle',
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          $id: '3',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          store_id: '1',
          store_name: 'Sillage Almadies',
          client_id: '103',
          client_name: 'Marie Sow',
          product_id: 'p303',
          product_name: 'Collier Diamants',
          issue_type: 'réparation',
          issue_description: 'Fermoir cassé',
          status: 'terminée',
          priority: 'low',
          user_seller: 'INdiaye',
          completion_date: new Date().toISOString(),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      setServiceRequests(demoData)
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes SAV', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const filteredServiceRequests = serviceRequests.filter(request => {
    const searchTermLower = searchTerm?.toLowerCase() || ''
    const clientName = request.client_name?.toLowerCase() || ''
    const productName = request.product_name?.toLowerCase() || ''
    const issueDesc = request.issue_description?.toLowerCase() || ''
    
    const matchesSearch = searchTerm === '' || 
      clientName.includes(searchTermLower) || 
      productName.includes(searchTermLower) ||
      issueDesc.includes(searchTermLower)
      
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'nouvelle':
        return <Badge className="bg-blue-500">Nouvelle</Badge>
      case 'en_attente':
        return <Badge className="bg-yellow-500">En attente</Badge>
      case 'en_cours':
        return <Badge className="bg-purple-500">En cours</Badge>
      case 'terminée':
        return <Badge className="bg-green-500">Terminée</Badge>
      case 'annulée':
        return <Badge className="bg-gray-500">Annulée</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">Haute</Badge>
      case 'medium':
        return <Badge className="bg-orange-500">Moyenne</Badge>
      case 'low':
        return <Badge className="bg-green-500">Basse</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }
  
  return (
    <PageProtection>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Service Après Vente</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setActiveTab('new')}>
              Nouvelle demande SAV
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Aperçu</TabsTrigger>
            <TabsTrigger value="new">Nouvelle demande</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total des demandes</CardTitle>
                  <BsClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{serviceRequests.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En cours</CardTitle>
                  <BsTools className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {serviceRequests.filter(req => req.status === 'en_cours').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Priorité haute</CardTitle>
                  <BsExclamationTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {serviceRequests.filter(req => req.priority === 'high').length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Délai moyen</CardTitle>
                  <BsClock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4j</div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Demandes SAV en cours</CardTitle>
                <CardDescription>
                  Gérez toutes les demandes de service après-vente
                </CardDescription>
                <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-[200px]"
                    />
                    <BsSearch className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="nouvelle">Nouvelle</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="en_cours">En cours</SelectItem>
                      <SelectItem value="terminée">Terminée</SelectItem>
                      <SelectItem value="annulée">Annulée</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Priorité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les priorités</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-800"></div>
                  </div>
                ) : filteredServiceRequests.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left">Référence</th>
                          <th className="pb-2 text-left">Date</th>
                          <th className="pb-2 text-left">Client</th>
                          <th className="pb-2 text-left">Produit</th>
                          <th className="pb-2 text-left">Type</th>
                          <th className="pb-2 text-left">Statut</th>
                          <th className="pb-2 text-left">Priorité</th>
                          <th className="pb-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredServiceRequests.map((request) => (
                          <tr key={request.$id} className="border-b">
                            <td className="py-2">{request.$id}</td>
                            <td className="py-2">{request.date && !isNaN(new Date(request.date).getTime()) ? new Date(request.date).toLocaleDateString('fr-FR') : 'N/A'}</td>
                            <td className="py-2">{request.client_name}</td>
                            <td className="py-2">{request.product_name}</td>
                            <td className="py-2">{request.issue_type}</td>
                            <td className="py-2">{getStatusBadge(request.status)}</td>
                            <td className="py-2">{getPriorityBadge(request.priority)}</td>
                            <td className="py-2">
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">Détails</Button>
                                <Button variant="outline" size="sm">Éditer</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex justify-center p-4 text-gray-500">
                    Aucune demande SAV ne correspond aux filtres
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="new">
  <Card>
    <CardHeader>
      <CardTitle>Nouvelle demande SAV</CardTitle>
      <CardDescription>Enregistrer une nouvelle demande de service après-vente</CardDescription>
    </CardHeader>
    <CardContent>
      <form
        className="space-y-4 max-w-xl mx-auto"
        onSubmit={async (e) => {
          e.preventDefault();
          // Simulation d'ajout local (à remplacer par un appel API/Appwrite)
          const form = e.target as HTMLFormElement;
          const data = Object.fromEntries(new FormData(form)) as any;
          setServiceRequests([
            {
              $id: Math.random().toString(36).substring(2, 10),
              date: new Date().toISOString(),
              store_id: data.store_id,
              store_name: data.store_name,
              client_id: data.client_id,
              client_name: data.client_name,
              product_id: data.product_id,
              product_name: data.product_name,
              issue_type: data.issue_type,
              issue_description: data.issue_description,
              status: 'nouvelle',
              priority: data.priority,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...serviceRequests
          ]);
          setActiveTab('overview');
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="store_id">Magasin</Label>
            <Input name="store_id" id="store_id" placeholder="ID magasin" required />
            <Input name="store_name" id="store_name" placeholder="Nom magasin" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="client_id">Client</Label>
            <Input name="client_id" id="client_id" placeholder="ID client" required />
            <Input name="client_name" id="client_name" placeholder="Nom client" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="product_id">Produit</Label>
            <Input name="product_id" id="product_id" placeholder="ID produit" required />
            <Input name="product_name" id="product_name" placeholder="Nom produit" className="mt-2" required />
          </div>
          <div>
            <Label htmlFor="issue_type">Type de problème</Label>
<Select value={issueType} onValueChange={v => setIssueType(v as 'réparation' | 'échange' | 'remboursement' | 'autre')} defaultValue="réparation">
  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="réparation">Réparation</SelectItem>
    <SelectItem value="échange">Échange</SelectItem>
    <SelectItem value="remboursement">Remboursement</SelectItem>
    <SelectItem value="autre">Autre</SelectItem>
  </SelectContent>
</Select>
<input type="hidden" name="issue_type" value={issueType} />
<Label htmlFor="priority" className="mt-2">Priorité</Label>
<Select value={priority} onValueChange={v => setPriority(v as 'high' | 'medium' | 'low')} defaultValue="medium">
  <SelectTrigger><SelectValue placeholder="Priorité" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="high">Haute</SelectItem>
    <SelectItem value="medium">Moyenne</SelectItem>
    <SelectItem value="low">Basse</SelectItem>
  </SelectContent>
</Select>
<input type="hidden" name="priority" value={priority} />
          </div>
        </div>
        <div>
          <Label htmlFor="issue_description">Description du problème</Label>
          <Input name="issue_description" id="issue_description" placeholder="Décrivez le problème rencontré" required />
        </div>
        <div>
          <Label htmlFor="estimated_completion_date">Date estimée de résolution</Label>
          <Input type="date" name="estimated_completion_date" id="estimated_completion_date" />
        </div>
        <div className="flex justify-between">
  <Button type="button" variant="outline" onClick={() => setActiveTab('overview')}>Retour à l’aperçu</Button>
  <Button type="submit">Enregistrer</Button>
</div>
      </form>
    </CardContent>
  </Card>
</TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des demandes SAV</CardTitle>
                <CardDescription>Consultez l'historique complet des demandes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-gray-500">
                  <h3 className="text-xl font-semibold mb-2">En cours de développement</h3>
                  <p>Bientôt disponible</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques SAV</CardTitle>
                <CardDescription>Analysez les performances du service après-vente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-gray-500">
                  <h3 className="text-xl font-semibold mb-2">En cours de développement</h3>
                  <p>Bientôt disponible</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageProtection>
  )
}
