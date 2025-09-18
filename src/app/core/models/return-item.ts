import { Customer } from './customer';
import { Product } from './product';

export interface ReturnItem {
  id: string;
  customer: Customer;
  product: Product;
  quantity: number; // Fraction value e.g 3/2
  reason: ReturnReason;
  returnDate: Date;
}

export type ReturnReason = 'EXPIRED' | 'DAMAGED' | 'WRONG_ITEM' | 'OTHER';
