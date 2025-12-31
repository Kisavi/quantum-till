import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { StockItem } from '../models/stock-item';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private firestore = inject(Firestore);

  public stockCollRef = collection(this.firestore, 'stock-items') as CollectionReference<StockItem>;

  getStockItems(): Observable<StockItem[]> {
    return collectionData(this.stockCollRef);
  }

  addStockItem(stockItem: StockItem): Promise<void> {
    const docRef = doc(this.stockCollRef);
    stockItem.id = docRef.id;
    return setDoc(docRef, stockItem);
  }

  updateStockItem(id: string, stockItem: Partial<StockItem>): Promise<void> {
    const docRef = doc(this.stockCollRef, id);
    return updateDoc(docRef, stockItem);
  }

  deleteStockItem(id: string): Promise<void> {
    const docRef = doc(this.stockCollRef, id);
    return deleteDoc(docRef);
  }
}
