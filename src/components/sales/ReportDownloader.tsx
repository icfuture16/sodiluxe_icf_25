'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FiDownload, FiPrinter, FiFile } from 'react-icons/fi'
import { Sale } from '@/types/appwrite.types'
import { reportService } from '@/lib/services/reportService'
import { toast } from 'sonner'

interface SalesFilters {
  storeId?: string | null
  startDate?: Date | null
  endDate?: Date | null
  status?: 'pending' | 'completed' | 'cancelled' | null
  paymentMethod?: string | null
  minAmount?: string
  maxAmount?: string
  searchTerm?: string
}

interface ReportDownloaderProps {
  sales: Sale[]
  filters: SalesFilters
  disabled?: boolean
}

export default function ReportDownloader({ sales, filters, disabled = false }: ReportDownloaderProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingType, setGeneratingType] = useState<string | null>(null)

  const handleDownloadCSV = async () => {
    if (sales.length === 0) {
      toast.error('Aucune vente à exporter')
      return
    }

    setIsGenerating(true)
    setGeneratingType('csv')

    try {
      await reportService.generateReport(sales, filters, {
        format: 'csv',
        type: 'detailed'
      })
      
      toast.success('Rapport CSV téléchargé avec succès !', {
        description: `${sales.length} vente(s) exportée(s)`
      })
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error)
      toast.error('Erreur lors de la génération du rapport', {
        description: 'Veuillez réessayer ou contacter le support'
      })
    } finally {
      setIsGenerating(false)
      setGeneratingType(null)
    }
  }

  const handlePrint = () => {
    if (sales.length === 0) {
      toast.error('Aucune vente à imprimer')
      return
    }

    // Trouver le tableau des ventes
    const salesTable = document.querySelector('.sales-table-container table')
    if (!salesTable) {
      toast.error('Tableau des ventes introuvable')
      return
    }

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Impossible d\'ouvrir la fenêtre d\'impression')
      return
    }

    // Styles CSS pour l'impression
    const printStyles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          background: white;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
          font-size: 11px;
        }
        td {
          font-size: 10px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding: 10px;
        }
        .header h1 {
          font-size: 18px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 12px;
          color: #666;
        }
        @media print {
          body { print-color-adjust: exact; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      </style>
    `

    // Cloner le tableau et nettoyer le contenu
    const tableClone = salesTable.cloneNode(true) as HTMLElement
    
    // Supprimer les éléments non nécessaires (boutons, icônes, etc.)
    const actionsColumn = tableClone.querySelectorAll('th:last-child, td:last-child')
    actionsColumn.forEach(el => el.remove())
    
    // Nettoyer les spans et badges pour ne garder que le texte
    const spans = tableClone.querySelectorAll('span')
    spans.forEach(span => {
      const text = span.textContent || ''
      span.replaceWith(document.createTextNode(text))
    })
    
    // Supprimer les icônes
    const icons = tableClone.querySelectorAll('svg, .lucide')
    icons.forEach(icon => icon.remove())

    // Contenu HTML pour l'impression
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Liste des Ventes</title>
          <meta charset="utf-8">
          ${printStyles}
        </head>
        <body>
          <div class="header">
            <h1>Liste des Ventes</h1>
            <p>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
            <p>Total: ${sales.length} vente${sales.length > 1 ? 's' : ''}</p>
          </div>
          ${tableClone.outerHTML}
        </body>
      </html>
    `

    // Écrire le contenu et imprimer
    printWindow.document.write(printContent)
    printWindow.document.close()
    
    // Attendre que le contenu soit chargé puis imprimer
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Badge du nombre de ventes */}
      <div className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-md font-medium">
        {sales.length} vente{sales.length > 1 ? 's' : ''}
      </div>

      {/* Boutons de téléchargement */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          onClick={handleDownloadCSV}
          disabled={isGenerating || sales.length === 0}
        >
          {isGenerating && generatingType === 'csv' ? (
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiFile className="w-4 h-4" />
          )}
          <span>Excel</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          onClick={handlePrint}
          disabled={sales.length === 0}
        >
          <FiPrinter className="w-4 h-4" />
          <span>Imprimer</span>
        </Button>
      </div>
      
      {/* Indicateur de progression global */}
      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="hidden sm:inline">Génération en cours...</span>
        </div>
      )}


    </div>
  )
}