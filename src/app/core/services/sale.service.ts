import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  CollectionReference,
  doc,
  Firestore,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { firstValueFrom, Observable, switchMap } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { Customer } from '../models/customer';
import { PaymentMethod, Sale, SaleStatus } from '../models/sale';
import { StockService } from './stock.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private firestore = inject(Firestore);
  private stockService = inject(StockService);
  private userService = inject(UserService);

  salesCollRef = collection(this.firestore, 'sales') as CollectionReference<Sale>;

  getSales(): Observable<Sale[]> {
    return this.userService.getCurrentUser().pipe(
      switchMap((user) => {
        let q = query(this.salesCollRef, where('soldBy.uid', '==', user?.uid)); // Get only sales done by the current user
        if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
          q = this.salesCollRef; // Get all sales for admins and managers
        }
        return collectionData(q);
      }),
    );
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
      const stockCollRef = this.stockService.productStockCollRef;

      // Reduce stock levels of all items in the cart
      for (let cartItem of items) {
        const productStockDocRef = doc(stockCollRef, cartItem.stockItem.product.id);
        const productStockDoc = await transaction.get(productStockDocRef);

        if (productStockDoc.exists()) {
          const quantity = productStockDoc.data().quantity - cartItem.quantity;
          transaction.update(productStockDocRef, { quantity });
        }
      }

      // Create and record sale
      const docRef = doc(this.salesCollRef);
      const sale: Sale = {
        id: docRef.id,
        soldBy: currentUser,
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
    return runTransaction(this.firestore, async (transaction) => {
      const saleDocRef = doc(this.salesCollRef, id);

      const sale = await transaction.get(saleDocRef);

      if (!sale.exists()) {
        throw new Error('Sale not found');
      }

      const stockCollRef = this.stockService.productStockCollRef;

      // Restore sold stock from all cart items
      for (let cartItem of sale.data().items) {
        const productStockDocRef = doc(stockCollRef, cartItem.stockItem.product.id);
        const productStockDoc = await transaction.get(productStockDocRef);

        if (productStockDoc.exists()) {
          const quantity = productStockDoc.data().quantity + cartItem.quantity;
          transaction.update(productStockDocRef, { quantity });
        }
      }

      transaction.delete(saleDocRef);
    });
  }
}
