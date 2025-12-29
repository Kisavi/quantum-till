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
import { Observable } from 'rxjs';
import { Sale } from '../models/sale';

@Injectable({
  providedIn: 'root',
})
export class SaleService {
  private firestore = inject(Firestore);

  salesCollRef = collection(this.firestore, 'sales') as CollectionReference<Sale>;

  getSales(): Observable<Sale[]> {
    return collectionData(this.salesCollRef);
  }

  addSale(sale: Sale): Promise<void> {
    const docRef = doc(this.salesCollRef);
    sale.id = docRef.id;
    return setDoc(docRef, sale);
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
