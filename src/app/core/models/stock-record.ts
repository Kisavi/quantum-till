import { Timestamp } from '@angular/fire/firestore';
import { Product } from './product';

export interface StockRecord {
  id: string;
  product: Product;
  quantity: number;
  adjustedOn: Timestamp;
  manufactureDate: string; // Current Date (yyyy-MM-DD)
  expiryDate: string; // Current Date + Product Shelf Life (yyyy-MM-DD)
}
