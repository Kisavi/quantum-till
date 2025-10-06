import { OrderItem } from './order-item';
import { Timestamp } from 'firebase/firestore';
import { User } from './user';

export interface Order {
  id: string;
  rider: User;
  customerId: string;
  items: OrderItem[];
  totalPrice: number;
  date: Timestamp;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
}

export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELED';

export type PaymentMethod = 'CASH' | 'TILL_NUMBER' | 'SEND_MONEY' | 'MPESA_DEPOSIT';
