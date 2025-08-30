import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { DashboardData } from '@/hooks/useDashboardData';

// Extend jsPDF to include previousAutoTable property
declare module 'jspdf' {
  interface jsPDF {
    previousAutoTable: {
      finalY: number;
    };
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Types pour les options d'exportation
export interface ExportOptions {
  format: 'pdf' | 'csv';
  includeRawData: boolean;
  pdfOrientation?: 'portrait' | 'landscape';
  period: string;
}

/**
 * Exporte les données du tableau de bord au format PDF
 */
export const exportToPdf = (
  dashboardData: DashboardData,
  options: ExportOptions
): void => {
  const { pdfOrientation = 'portrait', period, includeRawData } = options;
  
  // Créer un nouveau document PDF
  const doc = new jsPDF({
    orientation: pdfOrientation,
    unit: 'mm',
    format: 'a4',
  });
  
  // Ajouter le titre
  doc.setFontSize(18);
  doc.text('Tableau de Bord Sodiluxe', 14, 22);
  
  // Ajouter la période
  doc.setFontSize(12);
  doc.text(`Période: ${period}`, 14, 30);
  doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 14, 36);
  
  // Ajouter les KPIs principaux
  doc.setFontSize(14);
  doc.text('Indicateurs de Performance Clés', 14, 46);
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Tableau des KPIs
  const kpiData = [
    ['Indicateur', 'Valeur', 'Évolution'],
    ['Chiffre d\'affaires', formatAmount(dashboardData.revenue.value), 
      dashboardData.revenue.changePercent ? `${dashboardData.revenue.changePercent.toFixed(1)}%` : 'N/A'],
    ['Ventes', dashboardData.sales.value.toString(), 
      dashboardData.sales.changePercent ? `${dashboardData.sales.changePercent.toFixed(1)}%` : 'N/A'],
    ['Clients', dashboardData.customers.value.toString(), 
      dashboardData.customers.changePercent ? `${dashboardData.customers.changePercent.toFixed(1)}%` : 'N/A'],
    ['Panier moyen', formatAmount(dashboardData.averageBasket.value), 
      dashboardData.averageBasket.changePercent ? `${dashboardData.averageBasket.changePercent.toFixed(1)}%` : 'N/A'],
    ['Nouveaux clients', dashboardData.newCustomers.value.toString(), 
      dashboardData.newCustomers.changePercent ? `${dashboardData.newCustomers.changePercent.toFixed(1)}%` : 'N/A'],
    ['Produits vendus', dashboardData.products.value.toString(), 
      dashboardData.products.changePercent ? `${dashboardData.products.changePercent.toFixed(1)}%` : 'N/A'],
  ];
  
  doc.autoTable({
    startY: 50,
    head: [kpiData[0]],
    body: kpiData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] }, // Couleur indigo de Tailwind
  });
  
  // Si les données brutes sont demandées, ajouter les produits les plus vendus
  if (includeRawData && dashboardData.products.topProducts && dashboardData.products.topProducts.length > 0) {
    const topProductsY = doc.previousAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Produits les plus vendus', 14, topProductsY);
    
    const topProductsData = [
      ['Produit', 'Ventes', 'Chiffre d\'affaires', 'Marge'],
      ...dashboardData.products.topProducts.map(product => [
        product.name,
        product.sales.toString(),
        formatAmount(product.revenue),
        `${(product.margin * 100).toFixed(1)}%`
      ])
    ];
    
    doc.autoTable({
      startY: topProductsY + 4,
      head: [topProductsData[0]],
      body: topProductsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
    });
  }
  
  // Ajouter les alertes si elles existent
  if (dashboardData.alerts && dashboardData.alerts.length > 0) {
    const alertsY = doc.previousAutoTable ? doc.previousAutoTable.finalY + 10 : 120;
    doc.setFontSize(14);
    doc.text('Alertes', 14, alertsY);
    
    const alertsData = [
      ['Type', 'Message', 'Date'],
      ...dashboardData.alerts.map(alert => [
        alert.type,
        alert.message,
        new Date(alert.date).toLocaleDateString()
      ])
    ];
    
    doc.autoTable({
      startY: alertsY + 4,
      head: [alertsData[0]],
      body: alertsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] },
    });
  }
  
  // Ajouter le pied de page
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(
      `Page ${i} sur ${pageCount} - Sodiluxe CRM`,
      (doc.internal as any).pageSize.width / 2,
      (doc.internal as any).pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Sauvegarder le PDF
  doc.save(`tableau-de-bord-sodiluxe-${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Exporte les données du tableau de bord au format CSV
 */
export const exportToCsv = (
  dashboardData: DashboardData,
  options: ExportOptions
): void => {
  const { includeRawData } = options;
  
  // Fonction pour formater les valeurs monétaires
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Créer les en-têtes et les lignes pour les KPIs
  let csvContent = 'Indicateur,Valeur,Évolution\n';
  
  // Ajouter les lignes pour chaque KPI
  csvContent += `Chiffre d'affaires,${formatAmount(dashboardData.revenue.value)},${dashboardData.revenue.changePercent ? `${dashboardData.revenue.changePercent.toFixed(1)}%` : 'N/A'}\n`;
  csvContent += `Ventes,${dashboardData.sales.value},${dashboardData.sales.changePercent ? `${dashboardData.sales.changePercent.toFixed(1)}%` : 'N/A'}\n`;
  csvContent += `Clients,${dashboardData.customers.value},${dashboardData.customers.changePercent ? `${dashboardData.customers.changePercent.toFixed(1)}%` : 'N/A'}\n`;
  csvContent += `Panier moyen,${formatAmount(dashboardData.averageBasket.value)},${dashboardData.averageBasket.changePercent ? `${dashboardData.averageBasket.changePercent.toFixed(1)}%` : 'N/A'}\n`;
  csvContent += `Nouveaux clients,${dashboardData.newCustomers.value},${dashboardData.newCustomers.changePercent ? `${dashboardData.newCustomers.changePercent.toFixed(1)}%` : 'N/A'}\n`;
  csvContent += `Produits vendus,${dashboardData.products.value},${dashboardData.products.changePercent ? `${dashboardData.products.changePercent.toFixed(1)}%` : 'N/A'}\n`;
  
  // Si les données brutes sont demandées, ajouter les produits les plus vendus
  if (includeRawData && dashboardData.products.topProducts && dashboardData.products.topProducts.length > 0) {
    csvContent += '\n\nProduits les plus vendus\n';
    csvContent += 'Produit,Ventes,Chiffre d\'affaires,Marge\n';
    
    dashboardData.products.topProducts.forEach(product => {
      csvContent += `${product.name},${product.sales},${formatAmount(product.revenue)},${(product.margin * 100).toFixed(1)}%\n`;
    });
  }
  
  // Ajouter les alertes si elles existent
  if (includeRawData && dashboardData.alerts && dashboardData.alerts.length > 0) {
    csvContent += '\n\nAlertes\n';
    csvContent += 'Type,Message,Date\n';
    
    dashboardData.alerts.forEach(alert => {
      csvContent += `${alert.type},${alert.message},${new Date(alert.date).toLocaleDateString()}\n`;
    });
  }
  
  // Créer un blob et le télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `tableau-de-bord-sodiluxe-${new Date().toISOString().split('T')[0]}.csv`);
};

/**
 * Fonction principale d'exportation qui détermine le format et appelle la fonction appropriée
 */
export const exportDashboardData = (
  dashboardData: DashboardData,
  options: ExportOptions
): void => {
  const { format } = options;
  
  if (format === 'pdf') {
    exportToPdf(dashboardData, options);
  } else if (format === 'csv') {
    exportToCsv(dashboardData, options);
  } else {
    console.error('Format d\'exportation non pris en charge:', format);
  }
};
