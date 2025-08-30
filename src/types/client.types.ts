import { AppwriteDocument } from './appwrite.types';

export type ClientSegment = 'premium' | 'gold' | 'silver' | 'bronze';
export type LoyaltyStatus = 'bronze' | 'argent' | 'or';

export interface Client extends AppwriteDocument {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  birthDate?: string;
  gender: 'homme' | 'femme' | 'entreprise';
  loyaltyPoints: number;
  totalSpent: number;
  segment: ClientSegment;
  vipStatus: boolean;
  preferredStore?: string;
  preferredCategories?: string[];
  lastPurchase?: string;
  firstPurchase?: string;
  purchaseFrequency?: number;
  tags?: string[];
  // Nouveaux champs pour la fidélité
  loyaltyStatus?: LoyaltyStatus;
  loyaltyCardNumber?: string;
}

export interface ClientInput {
  email: string;
  fullName: string;
  phone: string;
  address: string;
  birthDate?: string;
  gender: 'homme' | 'femme' | 'entreprise';
  loyaltyPoints?: number;
  totalSpent?: number;
  segment?: ClientSegment;
  vipStatus?: boolean;
  preferredStore?: string;
  preferredCategories?: string[];
  tags?: string[];
  // Nouveaux champs pour la fidélité
  loyaltyStatus?: LoyaltyStatus;
  loyaltyCardNumber?: string;
}

export interface ClientSearchFilters {
  searchTerm: string;
  phoneNumber?: string;
  email?: string;
  preferredStore?: string;
  segment?: ClientSegment[];
  totalSpentRange?: {
    min?: number;
    max?: number;
  };
  lastPurchaseRange?: {
    from?: Date;
    to?: Date;
  };
  tags?: string[];
}

export interface ClientAnalytics {
  overview: {
    totalClients: number;
    newClientsThisMonth: number;
    recentClients: number;
    churnRate: number;
    averageClv: number;
  };
  
  segmentation: {
    premium: { count: number; revenue: number };
    gold: { count: number; revenue: number };
    silver: { count: number; revenue: number };
    bronze: { count: number; revenue: number };
  };
  
  trends: {
    acquisitionTrend: any[];
    retentionTrend: any[];
    clvTrend: any[];
  };
  
  topClients: Client[];
  riskClients: Client[];
}

// Interface pour l'historique de fidélité
export interface LoyaltyHistory extends AppwriteDocument {
  clientId: string;
  pointsAdded: number;
  source: 'purchase' | 'bonus' | 'adjustment';
  saleId?: string;
  description: string;
  date: string;
  storeId?: string;
}

export interface LoyaltyHistoryInput {
  clientId: string;
  pointsAdded: number;
  source: 'purchase' | 'bonus' | 'adjustment';
  saleId?: string;
  description: string;
  storeId?: string;
}