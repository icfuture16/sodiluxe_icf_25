'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils/formatters"
import { Product } from "@/types/appwrite.types"
import { Badge } from "../ui/badge"

interface ProductDetailsProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onEdit: () => void
}

export default function ProductDetails({ 
  product, 
  isOpen, 
  onClose, 
  onEdit 
}: ProductDetailsProps) {
  if (!product) return null

  // Détermine le statut du stock
  const getStockStatus = () => {
    if (product.stockQuantity === 0) {
      return <Badge className="bg-red-500">Rupture de stock</Badge>
    } else if (
      product.lowStockThreshold && 
      product.stockQuantity <= product.lowStockThreshold
    ) {
      return <Badge className="bg-amber-500">Stock faible</Badge>
    } else {
      return <Badge className="bg-green-500">En stock</Badge>
    }
  }

  // Détermine le statut du produit
  const getProductStatus = () => {
    switch (product.status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>
      case 'inactive':
        return <Badge className="bg-gray-500">Inactif</Badge>
      case 'discontinued':
        return <Badge className="bg-orange-500">Discontinué</Badge>
      default:
        return <Badge>{product.status || 'Non défini'}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-3">
            {product.name || '-'}
            {getProductStatus()}
          </DialogTitle>
          <DialogDescription>
            Référence: <span className="font-medium">{product.reference || '-'}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-gray-500">Description</h3>
              <p>{product.description || 'Aucune description disponible'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-gray-500">Catégorie</h3>
                <p>{product.category || '-'}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-gray-500">Sous-catégorie</h3>
                <p>{product.subcategory || 'N/A'}</p>
              </div>
            </div>


          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-gray-500">Prix</h3>
                <p className="text-xl font-bold">{formatCurrency(product.price)}</p>
              </div>

              <div>
                <h3 className="font-medium text-sm text-gray-500">Stock</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold">{product.stockQuantity}</span>
                  {getStockStatus()}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm text-gray-500">Seuil de stock bas</h3>
              <p>{product.lowStockThreshold || "Non défini"}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm text-gray-500">Date d'ajout</h3>
              <p>{new Date(product.$createdAt).toLocaleDateString()}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm text-gray-500">Dernière mise à jour</h3>
              <p>{new Date(product.$updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={onEdit}>
            Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
