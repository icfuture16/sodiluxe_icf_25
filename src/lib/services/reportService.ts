import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Sale } from '@/types/appwrite.types'

// Extension du type jsPDF pour inclure autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

export interface SalesFilters {
  storeId?: string | null
  startDate?: Date | null
  endDate?: Date | null
  status?: 'pending' | 'completed' | 'cancelled' | null
  paymentMethod?: string | null
  minAmount?: string
  maxAmount?: string
}

export interface SalesReportData {
  sales: Sale[]
  filters: SalesFilters
  statistics: {
    totalSales: number
    totalAmount: number
    averageAmount: number
    completedSales: number
    pendingSales: number
    cancelledSales: number
    totalPaidAmount: number
    totalRemainingAmount: number
  }
}

export interface ReportOptions {
  type: 'summary' | 'detailed'
  format: 'csv' | 'pdf'
  includeLogo?: boolean
}

class ReportService {
  /**
   * Calcule les statistiques des ventes
   */
  private calculateStatistics(sales: Sale[]): SalesReportData['statistics'] {
    const totalSales = sales.length
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const averageAmount = totalSales > 0 ? totalAmount / totalSales : 0
    
    const completedSales = sales.filter(sale => sale.status === 'completed').length
    const pendingSales = sales.filter(sale => sale.status === 'pending').length
    const cancelledSales = sales.filter(sale => sale.status === 'cancelled').length
    
    const totalPaidAmount = sales.reduce((sum, sale) => {
      return sum + (sale.paidAmount || sale.totalAmount)
    }, 0)
    
    const totalRemainingAmount = sales.reduce((sum, sale) => {
      return sum + (sale.remainingAmount || 0)
    }, 0)
    
    return {
      totalSales,
      totalAmount,
      averageAmount,
      completedSales,
      pendingSales,
      cancelledSales,
      totalPaidAmount,
      totalRemainingAmount
    }
  }

  /**
   * Formate une date pour l'affichage
   */
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Formate un montant en CFA
   */
  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Génère un nom de fichier basé sur les filtres
   */
  private generateFileName(filters: SalesFilters, format: 'csv' | 'pdf'): string {
    const now = new Date()
    const timestamp = now.toISOString().slice(0, 10)
    
    let fileName = `rapport-ventes-${timestamp}`
    
    if (filters.storeId) {
      fileName += `-magasin-${filters.storeId.slice(0, 8)}`
    }
    
    if (filters.startDate && filters.endDate) {
      const start = filters.startDate.toISOString().slice(0, 10)
      const end = filters.endDate.toISOString().slice(0, 10)
      fileName += `-${start}-${end}`
    }
    
    return `${fileName}.${format}`
  }

  /**
   * Génère et télécharge un rapport CSV
   */
  async generateCSVReport(data: SalesReportData): Promise<void> {
    const { sales, statistics } = data
    
    // En-têtes CSV
    const headers = [
      'ID Vente',
      'Date',
      'Client',
      'Vendeur',
      'Magasin',
      'Type',
      'Montant Total',
      'Montant Payé',
      'Reste à Payer',
      'Statut',
      'Méthode de Paiement',
      'Points Fidélité Gagnés',
      'Notes'
    ]
    
    // Données des ventes
    const rows = sales.map(sale => [
      sale.$id,
      this.formatDate(sale.saleDate),
      sale.client?.fullName || 'Client non trouvé',
      sale.user?.fullName || sale.user_seller || 'Vendeur non trouvé',
      sale.store?.name || 'Magasin non trouvé',
      sale.isCredit ? 'Crédit' : 'Normal',
      sale.totalAmount.toString(),
      (sale.paidAmount || sale.totalAmount).toString(),
      (sale.remainingAmount || 0).toString(),
      sale.status,
      sale.paymentMethod,
      (sale.loyaltyPointsEarned || 0).toString(),
      sale.notes || ''
    ])
    
    // Statistiques en fin de fichier
    const statsRows = [
      [],
      ['STATISTIQUES'],
      ['Nombre total de ventes', statistics.totalSales.toString()],
      ['Montant total', statistics.totalAmount.toString()],
      ['Montant moyen', statistics.averageAmount.toFixed(2)],
      ['Ventes complétées', statistics.completedSales.toString()],
      ['Ventes en attente', statistics.pendingSales.toString()],
      ['Ventes annulées', statistics.cancelledSales.toString()],
      ['Montant total payé', statistics.totalPaidAmount.toString()],
      ['Montant restant à payer', statistics.totalRemainingAmount.toString()]
    ]
    
    // Création du contenu CSV
    const csvContent = [headers, ...rows, ...statsRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    // Téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = this.generateFileName(data.filters, 'csv')
    link.click()
    
    // Nettoyage
    URL.revokeObjectURL(link.href)
  }

  /**
   * Génère et télécharge un rapport PDF
   */
  async generatePDFReport(data: SalesReportData, options: ReportOptions): Promise<void> {
    const { sales, filters, statistics } = data
    const doc = new jsPDF()
    
    // Configuration de base
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    let yPosition = margin
    
    // En-tête du document
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('RAPPORT DE VENTES', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 15
    
    // Date de génération
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 20
    
    // Filtres appliqués
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Filtres appliqués:', margin, yPosition)
    yPosition += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    if (filters.storeId) {
      const store = sales.find(s => s.storeId === filters.storeId)?.store
      doc.text(`• Magasin: ${store?.name || 'Non spécifié'}`, margin + 5, yPosition)
      yPosition += 6
    }
    
    if (filters.startDate && filters.endDate) {
      doc.text(`• Période: du ${filters.startDate.toLocaleDateString('fr-FR')} au ${filters.endDate.toLocaleDateString('fr-FR')}`, margin + 5, yPosition)
      yPosition += 6
    }
    
    if (filters.status) {
      doc.text(`• Statut: ${filters.status}`, margin + 5, yPosition)
      yPosition += 6
    }
    
    if (filters.paymentMethod) {
      doc.text(`• Méthode de paiement: ${filters.paymentMethod}`, margin + 5, yPosition)
      yPosition += 6
    }
    
    if (filters.minAmount || filters.maxAmount) {
      const min = filters.minAmount || '0'
      const max = filters.maxAmount || '∞'
      doc.text(`• Montant: entre ${min} et ${max} CFA`, margin + 5, yPosition)
      yPosition += 6
    }
    
    yPosition += 10
    
    // Statistiques globales
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Statistiques globales:', margin, yPosition)
    yPosition += 10
    
    const statsData = [
      ['Nombre total de ventes', statistics.totalSales.toString()],
      ['Montant total', this.formatAmount(statistics.totalAmount)],
      ['Montant moyen par vente', this.formatAmount(statistics.averageAmount)],
      ['Ventes complétées', statistics.completedSales.toString()],
      ['Ventes en attente', statistics.pendingSales.toString()],
      ['Ventes annulées', statistics.cancelledSales.toString()],
      ['Montant total payé', this.formatAmount(statistics.totalPaidAmount)],
      ['Montant restant à payer', this.formatAmount(statistics.totalRemainingAmount)]
    ]
    
    doc.autoTable({
      startY: yPosition,
      head: [['Métrique', 'Valeur']],
      body: statsData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: margin, right: margin }
    })
    
    yPosition = (doc as any).lastAutoTable.finalY + 20
    
    // Tableau des ventes (si type détaillé)
    if (options.type === 'detailed' && sales.length > 0) {
      // Vérifier si on a assez de place, sinon nouvelle page
      if (yPosition > doc.internal.pageSize.height - 60) {
        doc.addPage()
        yPosition = margin
      }
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Détail des ventes:', margin, yPosition)
      yPosition += 10
      
      const salesTableData = sales.slice(0, 50).map(sale => [ // Limiter à 50 ventes pour éviter un PDF trop lourd
        sale.$id.slice(-8),
        this.formatDate(sale.saleDate),
        sale.client?.fullName?.slice(0, 20) || 'N/A',
        sale.user?.fullName?.slice(0, 15) || sale.user_seller?.slice(0, 15) || 'N/A',
        sale.isCredit ? 'Crédit' : 'Normal',
        this.formatAmount(sale.totalAmount),
        sale.status
      ])
      
      doc.autoTable({
        startY: yPosition,
        head: [['ID', 'Date', 'Client', 'Vendeur', 'Type', 'Montant', 'Statut']],
        body: salesTableData,
        theme: 'striped',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 }
        }
      })
      
      if (sales.length > 50) {
        yPosition = (doc as any).lastAutoTable.finalY + 10
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.text(`Note: Seules les 50 premières ventes sont affichées (${sales.length} au total)`, margin, yPosition)
      }
    }
    
    // Pied de page
    const pageCount = doc.getNumberOfPages()
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      doc.setPage(pageNum)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(
        `Page ${pageNum} sur ${pageCount} - Généré par Sodiluxe ICF`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }
    
    // Téléchargement
    doc.save(this.generateFileName(data.filters, 'pdf'))
  }

  /**
   * Génère un rapport basé sur les options spécifiées
   */
  async generateReport(
    sales: Sale[],
    filters: SalesFilters,
    options: ReportOptions
  ): Promise<void> {
    const statistics = this.calculateStatistics(sales)
    const reportData: SalesReportData = {
      sales,
      filters,
      statistics
    }
    
    if (options.format === 'csv') {
      await this.generateCSVReport(reportData, options)
    } else if (options.format === 'pdf') {
      await this.generatePDFReport(reportData, options)
    }
  }
}

export const reportService = new ReportService()
export default reportService