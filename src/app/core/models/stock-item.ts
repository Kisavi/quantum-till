import { Product } from './product';

export interface StockItem {
  id: string;
  product: Product;
  manufactureDate: string; // Current Date (yyyy-MM-DD)
  expiryDate: string; // Current Date + Product Shelf Life (yyyy-MM-DD)
  quantity: number;
}
