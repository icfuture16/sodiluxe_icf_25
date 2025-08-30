'use client'

import { useState } from 'react'
import { Plus, Minus, Users, CreditCard, Star, AlertCircle } from 'lucide-react'
import { useCachedClients, useUpdateCachedClient } from '@/hooks/useCachedClients'
import { useToast } from '@/components/ui/use-toast'
import { Client } from '@/types/client.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ClientsPage() {
  const { data: clients, isLoading, error } = useCachedClients()
  const updateClient = useUpdateCachedClient()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [pointsToModify, setPointsToModify] = useState(0)
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false)
  const [modifyType, setModifyType] = useState<'add' | 'subtract'>('add')

  // Filtrer les clients selon le terme de recherche
  const filteredClients = clients?.filter(client =>
    client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.loyaltyCardNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  // Fonction pour obtenir la couleur du badge selon le segment
  const getSegmentBadgeColor = (segment: string) => {
    switch (segment) {
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'or': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'argent': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'bronze': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Fonction pour ouvrir le dialogue de modification des points
  const openModifyDialog = (client: Client, type: 'add' | 'subtract') => {
    setSelectedClient(client)
    setModifyType(type)
    setPointsToModify(0)
    setIsModifyDialogOpen(true)
  }

  // Fonction pour modifier les points de fidélité
  const handleModifyPoints = async () => {
    if (!selectedClient || pointsToModify <= 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un nombre de points valide.',
        variant: 'destructive',
      })
      return
    }

    try {
      const currentPoints = selectedClient.loyaltyPoints || 0
      const newPoints = modifyType === 'add' 
        ? currentPoints + pointsToModify
        : Math.max(0, currentPoints - pointsToModify) // Empêcher les points négatifs

      await updateClient.mutateAsync({
        id: selectedClient.$id,
        updates: {
          loyaltyPoints: newPoints
        }
      })

      toast({
        title: 'Points mis à jour',
        description: `${pointsToModify} points ${modifyType === 'add' ? 'ajoutés à' : 'retirés de'} ${selectedClient.fullName}. Nouveau solde: ${newPoints} points.`,
      })

      setIsModifyDialogOpen(false)
      setSelectedClient(null)
      setPointsToModify(0)
    } catch (error) {
      console.error('Erreur lors de la modification des points:', error)
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier les points de fidélité.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des clients...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>Erreur lors du chargement des clients: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Clients</h1>
          <p className="text-gray-600 mt-1">
            Gérez les points de fidélité et les informations de vos clients
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{clients?.length || 0}</p>
                <p className="text-sm text-gray-600">Total Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {clients?.reduce((sum, client) => sum + (client.loyaltyPoints || 0), 0) || 0}
                </p>
                <p className="text-sm text-gray-600">Points Totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {clients?.filter(client => (client.loyaltyPoints || 0) > 0).length || 0}
                </p>
                <p className="text-sm text-gray-600">Avec Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round((clients?.reduce((sum, client) => sum + (client.loyaltyPoints || 0), 0) || 0) / (clients?.length || 1))}
                </p>
                <p className="text-sm text-gray-600">Points Moyens</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="search">Rechercher un client</Label>
              <Input
                id="search"
                placeholder="Nom, email, téléphone ou numéro de carte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des clients */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            Cliquez sur les boutons + ou - pour modifier les points de fidélité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Carte Fidélité</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead className="text-center">Points</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.$id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{client.fullName}</p>
                      <p className="text-sm text-gray-600">
                        Total dépensé: {client.totalSpent?.toLocaleString()} FCFA
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{client.email}</p>
                      <p className="text-gray-600">{client.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {client.loyaltyCardNumber}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSegmentBadgeColor(client.segment)}>
                      {client.segment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{client.loyaltyPoints || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:border-green-300"
                        onClick={() => openModifyDialog(client, 'add')}
                        disabled={updateClient.isPending}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:border-red-300"
                        onClick={() => openModifyDialog(client, 'subtract')}
                        disabled={updateClient.isPending || (client.loyaltyPoints || 0) === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Aucun client trouvé pour cette recherche.' : 'Aucun client enregistré.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de modification des points */}
      <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modifyType === 'add' ? 'Ajouter' : 'Retirer'} des points de fidélité
            </DialogTitle>
            <DialogDescription>
              Client: {selectedClient?.fullName}<br />
              Points actuels: {selectedClient?.loyaltyPoints || 0}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="points">Nombre de points à {modifyType === 'add' ? 'ajouter' : 'retirer'}</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max={modifyType === 'subtract' ? (selectedClient?.loyaltyPoints || 0) : undefined}
                value={pointsToModify}
                onChange={(e) => setPointsToModify(parseInt(e.target.value) || 0)}
                placeholder="Entrez le nombre de points"
                className="mt-1"
              />
            </div>
            
            {modifyType === 'add' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Nouveau solde: {(selectedClient?.loyaltyPoints || 0) + pointsToModify} points
                </p>
              </div>
            )}
            
            {modifyType === 'subtract' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  Nouveau solde: {Math.max(0, (selectedClient?.loyaltyPoints || 0) - pointsToModify)} points
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModifyDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleModifyPoints}
              disabled={pointsToModify <= 0 || updateClient.isPending}
              className={modifyType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {updateClient.isPending ? 'Modification...' : 
                `${modifyType === 'add' ? 'Ajouter' : 'Retirer'} ${pointsToModify} points`
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}