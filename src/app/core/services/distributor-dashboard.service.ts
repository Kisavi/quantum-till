

import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  collectionData
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Sale } from '../models/sale';
import { ReturnItem } from '../models/return-item';
import { Expense } from '../models/expense';

@Injectable({ providedIn: 'root' })
export class DistributorDashboardService {
  private firestore = inject(Firestore);

  /**
   * Get all sales for a trip and user
   */
getTripSales(tripId: string): Observable<Sale[]> {
  const q = query(
    collection(this.firestore, 'sales'),
    where('tripId', '==', tripId)
  );
  return collectionData(q, { idField: 'id' }) as Observable<Sale[]>;
}

  /**
   * Get all returns for a trip
   */
  getTripReturns(tripId: string): Observable<ReturnItem[]> {
    const q = query(
      collection(this.firestore, 'returns'),
      where('tripId', '==', tripId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<ReturnItem[]>;
  }

  /**
   * Get all expenses for a trip and user
   */
  getTripExpenses(tripId: string): Observable<Expense[]> {
    const q = query(
      collection(this.firestore, 'expenses'),
      where('tripId', '==', tripId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
  }
}
