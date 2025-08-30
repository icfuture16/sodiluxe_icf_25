import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'

interface Product {
  id: string
  name: string
  category: string
  sales: number
  revenue: number
  stock: number
}

interface TopSellingProductsProps {
  products: Product[]
  title?: string
  isLoading?: boolean
}

/**
 * Composant pour afficher les produits les plus vendus
 * 
 * @param products - Liste des produits à afficher
 * @param title - Titre du composant (optionnel)
 * @param isLoading - Indique si les données sont en cours de chargement
 */
export function TopSellingProducts({ products, title = "Produits les plus vendus", isLoading = false }: TopSellingProductsProps) {
  // Créer un tableau de placeholders pour l'état de chargement
  const loadingPlaceholders = Array(5).fill(0).map((_, index) => (
    <div key={`loading-${index}`} className="flex items-center">
      <div className="space-y-1 flex-1">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2 mt-1"></div>
      </div>
      <div className="ml-auto text-right space-y-1">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-16"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-12 mt-1"></div>
      </div>
    </div>
  ));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {isLoading ? (
            loadingPlaceholders
          ) : products.length === 0 ? (
            <div className="py-6 text-center text-gray-400">
              <p>Aucun produit disponible</p>
            </div>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex items-center">
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                <div className="ml-auto font-medium text-right space-y-1">
                  <div className="text-sm">{formatCurrency(product.revenue)}</div>
                  <div className="text-xs text-muted-foreground">{product.sales} ventes</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}