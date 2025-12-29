import { FieldValue } from '@angular/fire/firestore';
import { CartItem } from './cart-item';
import { Customer } from './customer';
import { User } from './user';

export interface Sale {
  id: string;
  rider: User;
  customer: Customer;
  items: CartItem[];
  totalPrice: number;
  date: FieldValue;
  status: SaleStatus;
  paymentMethod: PaymentMethod;
}

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELED';

export type PaymentMethod = 'CASH' | 'TILL_NUMBER' | 'SEND_MONEY' | 'MPESA_DEPOSIT';
