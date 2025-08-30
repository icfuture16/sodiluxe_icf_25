import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

interface Transaction {
  id: string
  client: string
  date: string
  amount: number
  status: 'completed' | 'pending' | 'cancelled'
  items: number
  products?: {
    name: string
    quantity: number
  }[]
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  isLoading?: boolean
}

/**
 * Composant pour afficher les transactions récentes
 * 
 * @param transactions - Liste des transactions à afficher
 * @param isLoading - Indique si les données sont en cours de chargement
 */
export function RecentTransactions({ transactions, isLoading = false }: RecentTransactionsProps) {
  // Créer un tableau de placeholders pour l'état de chargement
  const loadingPlaceholders = Array(5).fill(0).map((_, index) => (
    <div key={`loading-${index}`} className="flex items-center">
      <div className="mr-4 rounded-full p-2">
        <div className="h-2 w-2 rounded-full bg-gray-200 animate-pulse" />
      </div>
      <div className="space-y-1 flex-1">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/3"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4 mt-1"></div>
      </div>
      <div className="ml-auto text-right space-y-1">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-16"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-12 mt-1"></div>
      </div>
    </div>
  ));

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Transactions Récentes</CardTitle>
        <CardDescription>
          {isLoading ? (
            <div className="h-4 bg-gray-100 rounded animate-pulse w-48"></div>
          ) : (
            `${transactions.length} transactions au cours des derniers jours`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {isLoading ? (
            loadingPlaceholders
          ) : transactions.length === 0 ? (
            <div className="py-6 text-center text-gray-400">
              <p>Aucune transaction récente</p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center">
                <div className="mr-4 rounded-full p-2">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(transaction.status)}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{transaction.client}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(new Date(transaction.date))}
                  </p>
                  {transaction.products && transaction.products.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {transaction.products.map(product => `${product.name} (${product.quantity})`).join(', ')}
                    </p>
                  )}
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-medium">{formatCurrency(transaction.amount)}</p>
                  <p className="text-xs text-muted-foreground">{transaction.items} article{transaction.items > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Retourne la couleur correspondant au statut de la transaction
 * 
 * @param status - Statut de la transaction
 * @returns Classe CSS pour la couleur
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500'
    case 'pending':
      return 'bg-yellow-500'
    case 'cancelled':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}