import { Models } from 'appwrite';

export interface Reservation extends Models.Document {
  clientId: string;
  storeId: string;
  expectedPickupDate: string;
  actualPickupDate?: string;
  status: 'active' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
  depositAmount?: number;
  depositPaid: boolean;
  notes?: string;
  createdBy: string;
  totalAmount: number;
}

export interface ReservationItem extends Models.Document {
  reservationId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  notes?: string;
}

export interface ReservationInput {
  clientId: string;
  storeId: string;
  expectedPickupDate: string;
  depositAmount?: number;
  depositPaid: boolean;
  notes?: string;
  status: 'active' | 'confirmed' | 'completed' | 'cancelled' | 'expired';
  createdBy: string;
  totalAmount: number;
}

export interface ReservationItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  notes?: string;
}

export interface ReservationFormData {
  clientId: string;
  storeId: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
  }[];
  expectedPickupDate: string;
  depositAmount?: number;
  depositPaid: boolean;
  notes?: string;
}

export interface ReservationFilters {
  storeId?: string;
  status?: ('active' | 'confirmed' | 'completed' | 'cancelled' | 'expired')[];
  dateRange?: { start: string; end: string };
  clientSearch?: string;
}

