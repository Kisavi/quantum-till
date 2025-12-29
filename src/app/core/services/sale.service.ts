import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  Firestore,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { firstValueFrom, Observable } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { PaymentMethod, Sale, SaleStatus } from '../models/sale';
import { StockService } from './stock.service';
import { UserService } from './user.service';
import { Customer } from '../models/customer';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private firestore = inject(Firestore);
  private stockService = inject(StockService);
  private userService = inject(UserService);

  salesCollRef = collection(this.firestore, 'sales') as CollectionReference<Sale>;

  getSales(): Observable<Sale[]> {
    return collectionData(this.salesCollRef);
  }

  async checkout(
    customer: Customer,
    paymentMethod: PaymentMethod,
    items: CartItem[],
    totalPrice: number,
    status: SaleStatus,
  ): Promise<void> {
    const currentUser = await firstValueFrom(this.userService.getCurrentUser());

    if (!currentUser) {
      throw new Error('Current user not found');
    }

    // use a transaction to avoid race conditions and inconsistent stock
    return runTransaction(this.firestore, async (transaction) => {
      const stockCollRef = this.stockService.stockCollRef;

      // Reduce stock levels of all items in the cart
      items.forEach((cartItem) => {
        const stockItemDocRef = doc(stockCollRef, cartItem.stockItem.id);
        const quantity = cartItem.stockItem.quantity - cartItem.quantity;
        transaction.update(stockItemDocRef, { quantity });
      });

      // Create and record sale
      const docRef = doc(this.salesCollRef);
      const sale: Sale = {
        id: docRef.id,
        rider: currentUser,
        customer,
        date: serverTimestamp() as Timestamp,
        paymentMethod,
        items,
        totalPrice,
        status,
      };

      transaction.set(docRef, sale);
    });
  }

  updateSale(id: string, sale: Partial<Sale>): Promise<void> {
    const docRef = doc(this.salesCollRef, id);
    return updateDoc(docRef, sale);
  }

  deleteSale(id: string): Promise<void> {
    const docRef = doc(this.salesCollRef, id);
    return deleteDoc(docRef);
  }
}
