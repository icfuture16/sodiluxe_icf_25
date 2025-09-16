// Appwrite Document base interface
export interface AppwriteDocument {
  $id: string
  $createdAt: string
  $updatedAt: string
  $permissions: string[]
  $collectionId: string
  $databaseId: string
}

export interface AppwriteException {
  code: number;
  message: string;
  type: string;
}

// Client interface
export interface Client extends AppwriteDocument {
  email: string
  fullName: string
  phone: string
  address: string
  birthDate?: string
  gender: 'homme' | 'femme' | 'entreprise'
  loyaltyPoints: number
  totalSpent: number
  // Nouveaux champs pour la fidélité
  loyaltyStatus?: 'bronze' | 'argent' | 'or'
  loyaltyCardNumber?: string
}

export interface ClientInput {
  email: string
  fullName: string
  phone: string
  address: string
  birthDate?: string
  gender: 'homme' | 'femme' | 'entreprise'
  loyaltyPoints?: number
  totalSpent?: number
  // Nouveaux champs pour la fidélité
  loyaltyStatus?: 'bronze' | 'argent' | 'or'
  loyaltyCardNumber?: string
}

// Store interface
export interface Store extends AppwriteDocument {
  name: string
  address: string
  phone: string
  isActive: boolean
  brand?: 'sillage' | 'gemaber' | 'autre'
}

// User interface
export interface User extends AppwriteDocument {
  email: string
  fullName: string
  role: 'admin' | 'manager' | 'seller'
  storeId: string
}

// Product interface (amélioré pour le Catalogue produits)
export interface Product extends AppwriteDocument {
  name: string
  reference: string
  description?: string
  price: number
  costPrice?: number
  category: string
  subcategory?: string
  stockQuantity: number
  lowStockThreshold?: number
  images?: string[]
  specifications?: {
    [key: string]: string
  }
  storeId?: string
  status: 'active' | 'inactive' | 'discontinued'
}

// Payment method types
export type PaymentMethodType = 'especes' | 'carte' | 'wave' | 'orange_money' | 'cheque' | 'cheque_cadeau' | 'virement'

// Payment split interface
export interface PaymentSplit {
  method?: PaymentMethodType
  amount: number
  dueDate?: string
  date?: string
  status?: 'completed' | 'pending'
  isPaid?: boolean
}

// Sale interface (unifiée pour ventes normales et à crédit)
export interface Sale extends AppwriteDocument {
  clientId: string
  storeId: string
  userId: string
  user_seller: string // Identifiant unique du vendeur dérivé du fullName (max 9 caractères) - standardisé
  sellerId?: string // Champ pour compatibilité avec les anciennes ventes
  
  // Champ de différenciation
  isCredit: boolean // true pour ventes à crédit, false pour ventes normales
  
  // Champs communs
  totalAmount: number
  discountAmount: number
  paymentMethod: PaymentMethodType
  paymentSplits?: PaymentSplit[]
  saleDate: string
  status: 'pending' | 'completed' | 'cancelled'
  
  // Champs spécifiques aux ventes à crédit (optionnels)
  paidAmount?: number
  initialPayment?: number
  remainingAmount?: number
  numberOfInstallments?: number
  
  // Détails de paiement par méthode (pour ventes à crédit)
  payment_especes?: string
  payment_carte?: string
  payment_wave?: string
  payment_orange_money?: string
  payment_cheque?: string
  payment_cheque_cadeau?: string
  payment_virement?: string
  payment_mobile?: number
  payment_credit?: number
  payment_autre?: number
  
  // Champs additionnels
  loyaltyPointsEarned?: number
  loyaltyPointsUsed?: number
  notes?: string
  
  // Relations (populated when needed)
  client?: Client
  store?: Store
  user?: User
  items?: SaleItem[]
}

export interface SaleInput {
  clientId: string
  storeId: string
  userId: string
  user_seller: string // Identifiant unique du vendeur dérivé du fullName (max 9 caractères) - standardisé
  sellerId?: string // Champ pour compatibilité avec les anciennes ventes
  
  // Champ de différenciation
  isCredit: boolean // true pour ventes à crédit, false pour ventes normales
  
  // Champs communs
  totalAmount: number
  discountAmount?: number
  paymentMethod?: PaymentMethodType
  paymentSplits?: PaymentSplit[]
  saleDate?: string
  status?: 'pending' | 'completed' | 'cancelled'
  
  // Champs spécifiques aux ventes à crédit (optionnels)
  paidAmount?: number
  initialPayment?: number
  remainingAmount?: number
  numberOfInstallments?: number
  
  // Détails de paiement par méthode (pour ventes à crédit)
  payment_especes?: string
  payment_carte?: string
  payment_wave?: string
  payment_orange_money?: string
  payment_cheque?: string
  payment_cheque_cadeau?: string
  payment_virement?: string
  payment_mobile?: number
  payment_credit?: number
  payment_autre?: number
  
  // Champs additionnels
  loyaltyPointsEarned?: number
  loyaltyPointsUsed?: number
  notes?: string
}

// Sale Item interface (unifiée pour ventes normales et à crédit)
export interface SaleItem extends AppwriteDocument {
  saleId: string
  productId: string
  quantity: number
  unitPrice: number
  discountAmount: number
  // Champ pour compatibilité avec les anciennes ventes débitrices
  debitSaleId?: string
  // Relations (populated when needed)
  product?: Product
  sale?: Sale
  debitSale?: DebitSale // @deprecated - pour compatibilité uniquement
}

export interface SaleItemInput {
  saleId?: string
  productId: string
  quantity: number
  unitPrice: number
  discountAmount?: number
  // Champ pour compatibilité avec les anciennes ventes débitrices
  debitSaleId?: string
}

// Auth User (from Appwrite Account)
export interface AuthUser {
  $id: string
  $createdAt: string
  $updatedAt: string
  name: string
  email: string
  emailVerification: boolean
  status: boolean
}

// Service Après Vente (SAV) interface
export interface AfterSalesService extends AppwriteDocument {
  date: string
  storeId: string
  storeName: string
  clientId: string
  clientName: string
  productId: string
  productName: string
  issueType: 'réparation' | 'échange' | 'remboursement' | 'autre'
  issueDescription: string
  status: 'nouvelle' | 'en_attente' | 'en_cours' | 'terminée' | 'annulée'
  priority: 'high' | 'medium' | 'low'
  user_seller: string // Identifiant unique du vendeur dérivé du fullName (max 9 caractères) - standardisé
  estimatedCompletionDate?: string
  completionDate?: string
  notes?: string
}

export interface AfterSalesServiceInput {
  storeId: string
  storeName?: string
  clientId: string
  clientName?: string
  productId: string
  productName?: string
  issueType: 'réparation' | 'échange' | 'remboursement' | 'autre'
  issueDescription: string
  priority: 'high' | 'medium' | 'low'
  estimatedCompletionDate?: string
  notes?: string
}

// Vente Débitrice interface (clone de Sale)
// @deprecated Cette interface est dépréciée. Utilisez l'interface Sale unifiée avec isCredit: true
// Cette interface sera supprimée après la migration complète des données
export interface DebitSale extends AppwriteDocument {
  clientId: string
  storeId: string
  userId: string
  sellerId?: string
  totalAmount: number
  paidAmount: number
  discountAmount: number
  paymentMethod: 'especes' | 'carte' | 'wave' | 'orange_money' | 'cheque' | 'cheque_cadeau' | 'virement'
  payment_especes: string
  payment_carte: string
  payment_wave: string
  payment_orange_money: string
  payment_cheque: string
  payment_cheque_cadeau: string
  payment_virement: string
  saleDate: string
  status: 'pending' | 'completed' | 'cancelled'
  loyaltyPointsEarned?: number
  loyaltyPointsUsed?: number
  notes?: string
  // Relations
  client?: Client
  store?: Store
  user?: User
  seller?: User
  items?: DebitSaleItem[]
}

// @deprecated Cette interface est dépréciée. Utilisez l'interface SaleInput unifiée avec isCredit: true
export interface DebitSaleInput {
  clientId: string
  storeId: string
  userId: string
  sellerId?: string
  totalAmount: number
  paidAmount: number
  discountAmount: number
  paymentMethod: 'especes' | 'carte' | 'wave' | 'orange_money' | 'cheque' | 'cheque_cadeau' | 'virement'
  payment_especes: string
  payment_carte: string
  payment_wave: string
  payment_orange_money: string
  payment_cheque: string
  payment_cheque_cadeau: string
  payment_virement: string
  saleDate: string
  status: 'pending' | 'completed' | 'cancelled'
  loyaltyPointsEarned?: number
  loyaltyPointsUsed?: number
  notes?: string
  // Propriétés pour le schéma de la base de données
  initialPayment?: number
  remainingAmount?: number
  numberOfInstallments?: number
  createdAt?: string
}

// Article de Vente Débitrice interface (clone de SaleItem)
// @deprecated Cette interface est dépréciée. Utilisez l'interface SaleItem unifiée
// Cette interface sera supprimée après la migration complète des données
export interface DebitSaleItem extends AppwriteDocument {
  debitSaleId: string
  productId: string
  quantity: number
  unitPrice: number
  discountAmount: number
  // Relations
  debitSale?: DebitSale
  product?: Product
}

// @deprecated Cette interface est dépréciée. Utilisez l'interface SaleItemInput unifiée
export interface DebitSaleItemInput {
  productId: string
  quantity: number
  unitPrice: number
  discountAmount: number
}

