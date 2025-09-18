import { Product } from './product';

export interface StockItem {
  product: Product;
  manufactureDate: Date; // Current Date
  expiryDate: Date; // Current Date + Product Shelf Life
  quantity: number;
}
