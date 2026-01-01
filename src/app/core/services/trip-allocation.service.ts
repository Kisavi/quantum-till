

// stock-allocation.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { TripStockAllocation } from '../models/trip-stock-allocation';
import { Timestamp } from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class TripAllocationService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private allocationsCol = collection(this.firestore, 'tripStockAllocations');

  getAllocationsByTrip(tripId: string): Observable<TripStockAllocation[]> {
    const q = query(this.allocationsCol, where('tripId', '==', tripId));
    return collectionData(q, { idField: 'id' }) as Observable<TripStockAllocation[]>;
  }

  getAllocationsByUser(userId: string): Observable<TripStockAllocation[]> {
    const q = query(this.allocationsCol, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<TripStockAllocation[]>;
  }

  getAllAllocations(): Observable<TripStockAllocation[]> {
    return collectionData(this.allocationsCol, { idField: 'id' }) as Observable<TripStockAllocation[]>;
  }

  async addAllocation(allocation: Omit<TripStockAllocation, 'id'>): Promise<string> {
    const docRef = doc(this.allocationsCol);
    await setDoc(docRef, allocation);
    return docRef.id;
  }

  async updateAllocation(id: string, changes: Partial<Omit<TripStockAllocation, 'id'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'tripStockAllocations', id), changes);
  }

  async deleteAllocation(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'tripStockAllocations', id));
  }
}
