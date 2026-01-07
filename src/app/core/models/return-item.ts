import { Customer } from './customer';
import { Product } from './product';

export interface ReturnItem {
  id: string;
  tripId?: string;
  customer?: Customer;
  customerName?: string;
  product: Product;
  quantity: number;
  reason: ReturnReason;
  returnDate: Date;
  expiryDate: Date;
  createdBy: string;
}

export type ReturnReason = 'EXPIRED' | 'DAMAGED' | 'WRONG_ITEM' | 'SPOILT' | 'UNSOLD' | 'OTHER';
