'use client'

import { useState, useEffect } from 'react'
import { Client, ClientSearchFilters } from '@/types/client.types'
import { FiEdit2, FiEye, FiTrash2, FiPrinter, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import LoadingState from '@/components/ui/LoadingState'
import ErrorState from '@/components/ui/ErrorState'
import ClientDetailModal from './ClientDetailModal'
import ClientExportDialog from './ClientExportDialog'
import { useClientAnalytics } from '@/hooks/useCachedClients'
import { useAuth } from '@/hooks/useAuth'
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(amount).replace('XOF', 'FCFA');
};

interface ClientListProps {
  clients: Client[]
  isLoading: boolean
  error: Error | null
  filters: ClientSearchFilters
}

export default function ClientList({ clients, isLoading, error, filters }: ClientListProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // La fonction handlePrintClients sera définie après filteredClients
  const [currentPage, setCurrentPage] = useState(1)
  const [isHydrated, setIsHydrated] = useState(false)
  const { data: analytics } = useClientAnalytics()
  const { userProfile } = useAuth()
  
  useEffect(() => {
    setIsHydrated(true)
  }, [])
  
  const CLIENTS_PER_PAGE = 10

  // Filtrer les clients en fonction des filtres appliqués
  const filteredClients = clients.filter(client => {
    // Filtre par terme de recherche (nom, email, téléphone, carte de fidélité)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.toLowerCase().trim()
      const matchesName = client.fullName.toLowerCase().includes(searchTerm)
      const matchesEmail = client.email.toLowerCase().includes(searchTerm)
      const matchesPhone = client.phone.toLowerCase().includes(searchTerm)
      const matchesLoyaltyCard = client.loyaltyCardNumber?.toLowerCase().includes(searchTerm) || false
      
      if (!matchesName && !matchesEmail && !matchesPhone && !matchesLoyaltyCard) {
        return false
      }
    }
    
    // Filtre par segment
    if (filters.segment && filters.segment.length > 0 && !filters.segment.includes(client.segment as any)) {
      return false
    }

    return true
  })
  
  // Calculs pour la pagination
  const totalPages = Math.ceil(filteredClients.length / CLIENTS_PER_PAGE)
  const startIndex = (currentPage - 1) * CLIENTS_PER_PAGE
  const endIndex = startIndex + CLIENTS_PER_PAGE
  const paginatedClients = filteredClients.slice(startIndex, endIndex)
  
  // Réinitialiser la page courante si elle dépasse le nombre total de pages
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1)
  }

  const handlePrintClients = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      console.error('Impossible d\'ouvrir la fenêtre d\'impression')
      return
    }

    const printStyles = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
        }
        .print-logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
        }
        .print-header-content h1 {
          margin: 0;
          font-size: 24px;
          color: #1f2937;
        }
        .print-header-content p {
          margin: 5px 0 0 0;
          color: #6b7280;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .segment-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
        }
        .segment-premium { background-color: #f3e8ff; color: #7c3aed; }
        .segment-gold { background-color: #fef3c7; color: #d97706; }
        .segment-silver { background-color: #f3f4f6; color: #374151; }
        .segment-bronze { background-color: #fed7aa; color: #ea580c; }
        @media print {
          body { margin: 0; padding: 10px; }
          .print-header { margin-bottom: 20px; }
          table { font-size: 10px; }
          th, td { padding: 6px 8px; }
        }
      </style>
    `

    // Générer le tableau complet avec tous les clients filtrés
    const generateTableRows = () => {
      return filteredClients.map(client => {
        const segmentClass = {
          premium: 'segment-premium',
          gold: 'segment-gold', 
          silver: 'segment-silver',
          bronze: 'segment-bronze'
        }[client.segment] || 'segment-silver'
        
        const genderIcon = client.gender === 'entreprise' ? '🏢' : (client.gender === 'homme' ? '👨' : '👩')
        
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center;">
                <div style="width: 40px; height: 40px; background-color: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                  <span style="font-size: 16px;">${genderIcon}</span>
                </div>
                <div>
                  <div style="font-weight: 600; color: #1f2937;">${client.fullName}</div>
                  ${client.vipStatus ? '<div style="color: #6b7280; font-size: 11px;">⭐ VIP</div>' : ''}
                </div>
              </div>
            </td>
            <td>
              <div style="color: #1f2937;">${client.email}</div>
              <div style="color: #6b7280; font-size: 11px;">${client.phone}</div>
            </td>
            <td>
              <div style="font-family: monospace; color: #1f2937;">${client.loyaltyCardNumber || 'Non attribué'}</div>
            </td>
            <td>
              <span class="segment-badge ${segmentClass}">${client.segment}</span>
            </td>
            <td style="color: #6b7280;">
              ${formatCurrency(client.totalSpent)}
            </td>
            <td style="color: #6b7280;">
              ${client.loyaltyPoints} pts
            </td>
          </tr>
        `
      }).join('')
    }

    const currentDate = new Date().toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Liste des Clients - Sodiluxe</title>
        ${printStyles}
      </head>
      <body>
        <div class="print-header">
          <div class="print-logo">S</div>
          <div class="print-header-content">
            <h1>Liste des Clients</h1>
            <p>Généré le ${currentDate} - ${filteredClients.length} clients</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>Carte fidélité</th>
              <th>Segment</th>
              <th>Total dépensé</th>
              <th>Points fidélité</th>
            </tr>
          </thead>
          <tbody>
            ${generateTableRows()}
          </tbody>
        </table>
      </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
  }

  const closeDetailModal = () => {
    setSelectedClient(null)
  }

  // Éviter l'erreur d'hydratation en attendant que le composant soit hydraté
  if (!isHydrated || isLoading) {
    return <LoadingState message="Chargement des clients..." />
  }

  if (error) {
    return <ErrorState message={`Erreur lors du chargement des clients: ${error.message}`} />
  }

  if (filteredClients.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">Aucun client ne correspond à vos critères de recherche.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">{filteredClients.length} clients</h2>
          {totalPages > 1 && (
            <p className="text-sm text-gray-500">
              Page {currentPage} sur {totalPages} - Affichage de {startIndex + 1} à {Math.min(endIndex, filteredClients.length)} clients
            </p>
          )}
        </div>
        {userProfile?.role === 'admin' && (
          <button
            type="button"
            onClick={handlePrintClients}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FiPrinter className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
            Imprimer
          </button>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden clients-table-container">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carte fidélité
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Segment
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total dépensé
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Points fidélité
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedClients.map((client) => (
              <tr key={client.$id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {client.gender === 'entreprise' ? (
                        <span className="text-gray-500 text-lg">🏢</span>
                      ) : (
                        <span className="text-gray-500 text-lg">{client.gender === 'homme' ? '👨' : '👩'}</span>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{client.fullName}</div>
                      <div className="text-sm text-gray-500">{client.vipStatus && '⭐ VIP'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.email}</div>
                  <div className="text-sm text-gray-500">{client.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-mono">
                    {client.loyaltyCardNumber || 'Non attribué'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${client.segment === 'premium' ? 'bg-purple-100 text-purple-800' : ''}
                    ${client.segment === 'gold' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${client.segment === 'silver' ? 'bg-gray-100 text-gray-800' : ''}
                    ${client.segment === 'bronze' ? 'bg-orange-100 text-orange-800' : ''}
                  `}>
                    {client.segment}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(client.totalSpent)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.loyaltyPoints} pts
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => handleViewClient(client)}
                      title="Voir les détails"
                    >
                      <FiEye className="h-5 w-5" />
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => handleViewClient(client)}
                      title="Modifier"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleViewClient(client)}
                      title="Supprimer"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">{Math.min(endIndex, filteredClients.length)}</span> sur{' '}
                <span className="font-medium">{filteredClients.length}</span> résultats
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      <ClientDetailModal
        isOpen={!!selectedClient}
        onClose={closeDetailModal}
        client={selectedClient}
      />
      
      <ClientExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        clients={filteredClients}
        analytics={analytics}
      />
    </>
  )
}