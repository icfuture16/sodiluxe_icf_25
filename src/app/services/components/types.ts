// Types pour le module SAV
export interface ServiceAfterSale {
  $id: string
  date: string
  storeId: string
  storeName: string
  clientId: string
  clientName: string
  productId: string
  productName: string
  issueDescription: string
  user_seller?: string
  estimatedCompletionDate?: string
  completionDate?: string
  notes?: string
  issueType: 'réparation' | 'échange' | 'remboursement' | 'autre'
  status: 'nouvelle' | 'en_attente' | 'en_cours' | 'terminée' | 'annulée'
  priority: 'high' | 'medium' | 'low'
  created_at?: string
  updated_at?: string
}

// Types pour la gestion clientèle
export interface Client {
  $id: string
  name: string
  phone: string
  email: string
  gender: 'homme' | 'femme' | 'autre'
  loyalty_card_status: string
  total_spent: number
  birth_date?: string
  created_at: string
}

export interface Purchase {
  $id: string
  client_id: string
  date: string
  total_amount: number
  store_name: string
  products: Array<{name: string, quantity: number, price: number}>
}

export interface ClientContact {
  $id: string
  client_id: string
  date: string
  channel: 'appel' | 'email' | 'sms'
  response: boolean
  comments: string
}

// Interface pour les options de ComboBox
export interface ComboBoxOption {
  id: string
  label: string
}

// Interfaces pour les formulaires
export interface SavFormData {
  date: string
  issueDescription: string
  estimatedCompletionDate?: string
  notes?: string
  issueType: 'réparation' | 'échange' | 'remboursement' | 'autre'
  status: 'nouvelle' | 'en_attente' | 'en_cours' | 'terminée' | 'annulée'
  priority: 'high' | 'medium' | 'low'
}

// Interface pour l'historique des interventions (version simplifiée)
export interface InterventionHistoryEntry {
  $id?: string
  savId: string
  date: string
  action: string
  comment: string
  userName: string
}

export interface ContactFormData {
  date: string
  channel: 'appel' | 'email' | 'sms'
  response: boolean
  comments: string
}
