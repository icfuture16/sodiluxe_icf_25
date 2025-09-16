import { Models } from 'appwrite';

export interface Product extends Models.Document {
  name: string;
  description?: string;
  price: number;
  category: string;

  stockQuantity: number;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;

  stockQuantity: number;
}

