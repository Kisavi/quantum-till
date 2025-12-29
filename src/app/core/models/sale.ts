import { CartItem } from './cart-item';
import { Timestamp } from 'firebase/firestore';
import { User } from './user';

export interface Sale {
  id: string;
  rider: User;
  customerId: string;
  items: CartItem[];
  totalPrice: number;
  date: Timestamp;
  status: saleStatus;
  paymentMethod: PaymentMethod;
}

export type saleStatus = 'PENDING' | 'COMPLETED' | 'CANCELED';

export type PaymentMethod = 'CASH' | 'TILL_NUMBER' | 'SEND_MONEY' | 'MPESA_DEPOSIT';
