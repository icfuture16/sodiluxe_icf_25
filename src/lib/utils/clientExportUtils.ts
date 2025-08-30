import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Client, ClientAnalytics } from '@/types/client.types';
import { saveAs } from 'file-saver';

export interface ClientExportOptions {
  format: 'pdf' | 'csv';
  orientation?: 'portrait' | 'landscape';
  includeDetails?: boolean;
  includeAnalytics?: boolean;
}

/**
 * Exporte les données clients au format PDF
 * @param clients Liste des clients à exporter
 * @param analytics Données analytiques des clients (optionnel)
 * @param options Options d'exportation
 */
export function exportClientsToPdf(
  clients: Client[],
  analytics?: ClientAnalytics,
  options: Omit<ClientExportOptions, 'format'> = {}
): void {
  const { orientation = 'portrait', includeDetails = true, includeAnalytics = false } = options;
  
  // Créer un nouveau document PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Ajouter le titre
  doc.setFontSize(18);
  doc.text('Liste des Clients - Sodiluxe', 14, 20);
  doc.setFontSize(11);
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);

  // Ajouter les statistiques si demandé
  if (includeAnalytics && analytics) {
    doc.setFontSize(14);
    doc.text('Statistiques Clients', 14, 38);
    
    const statsData = [
      ['Total clients', analytics.overview.totalClients.toString()],
      ['Nouveaux ce mois', analytics.overview.newClientsThisMonth.toString()],
      ['Clients actifs', analytics.overview.activeClients.toString()],
      ['Valeur client moyenne', `${analytics.overview.averageClv.toFixed(2)} FCFA`],
    ];
    
    (doc as any).autoTable({
      startY: 42,
      head: [['Métrique', 'Valeur']],
      body: statsData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
    });

    // Ajouter la segmentation
    const segmentData = [
      ['Premium', analytics.segmentation.premium.count.toString(), `${analytics.segmentation.premium.revenue.toFixed(2)} FCFA`],
      ['Gold', analytics.segmentation.gold.count.toString(), `${analytics.segmentation.gold.revenue.toFixed(2)} FCFA`],
      ['Silver', analytics.segmentation.silver.count.toString(), `${analytics.segmentation.silver.revenue.toFixed(2)} FCFA`],
      ['Bronze', analytics.segmentation.bronze.count.toString(), `${analytics.segmentation.bronze.revenue.toFixed(2)} FCFA`],
    ];
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Segment', 'Nombre de clients', 'Revenu total']],
      body: segmentData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
    });
  }

  // Tableau des clients
  const startY = includeAnalytics && analytics ? (doc as any).lastAutoTable.finalY + 10 : 38;
  doc.setFontSize(14);
  doc.text('Liste des Clients', 14, startY);

  // Définir les colonnes en fonction du niveau de détail
  let columns: string[];
  let clientsData: any[][];

  if (includeDetails) {
    columns = ['Nom', 'Email', 'Téléphone', 'Segment', 'VIP', 'Points', 'Total dépensé'];
    clientsData = clients.map(client => [
      client.fullName,
      client.email || '-',
      client.phone,
      client.segment,
      client.vipStatus ? 'Oui' : 'Non',
      client.loyaltyPoints.toString(),
      `${client.totalSpent.toFixed(2)} FCFA`,
    ]);
  } else {
    columns = ['Nom', 'Téléphone', 'Segment', 'Total dépensé'];
    clientsData = clients.map(client => [
      client.fullName,
      client.phone,
      client.segment,
      `${client.totalSpent.toFixed(2)} FCFA`,
    ]);
  }

  (doc as any).autoTable({
    startY: startY + 4,
    head: [columns],
    body: clientsData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 40 },
    },
  });

  // Ajouter le pied de page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} sur ${pageCount} - Sodiluxe CRM`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Enregistrer le PDF
  doc.save('clients_sodiluxe.pdf');
}

/**
 * Exporte les données clients au format CSV
 * @param clients Liste des clients à exporter
 * @param options Options d'exportation
 */
export function exportClientsToCSV(
  clients: Client[],
  options: Omit<ClientExportOptions, 'format'> = {}
): void {
  const { includeDetails = true } = options;
  
  // Définir les en-têtes en fonction du niveau de détail
  let headers: string[];
  let rows: string[][];

  if (includeDetails) {
    headers = ['Nom', 'Email', 'Téléphone', 'Adresse', 'Genre', 'Segment', 'VIP', 'Points', 'Total dépensé', 'Magasin préféré', 'Dernier achat'];
    rows = clients.map(client => [
      client.fullName,
      client.email || '',
      client.phone,
      client.address || '',
      client.gender,
      client.segment,
      client.vipStatus ? 'Oui' : 'Non',
      client.loyaltyPoints.toString(),
      client.totalSpent.toString(),
      client.preferredStore || '',
      client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString('fr-FR') : '',
    ]);
  } else {
    headers = ['Nom', 'Téléphone', 'Segment', 'Total dépensé'];
    rows = clients.map(client => [
      client.fullName,
      client.phone,
      client.segment,
      client.totalSpent.toString(),
    ]);
  }

  // Convertir en CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Créer un blob et télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, 'clients_sodiluxe.csv');
}

/**
 * Fonction principale pour exporter les données clients
 * @param clients Liste des clients à exporter
 * @param options Options d'exportation
 * @param analytics Données analytiques des clients (optionnel)
 */
export function exportClientsData(
  clients: Client[],
  options: ClientExportOptions,
  analytics?: ClientAnalytics
): void {
  const { format } = options;
  
  if (format === 'pdf') {
    exportClientsToPdf(clients, analytics, options);
  } else if (format === 'csv') {
    exportClientsToCSV(clients, options);
  }
}