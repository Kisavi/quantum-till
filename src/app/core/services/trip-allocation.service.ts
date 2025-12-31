import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, collectionData, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { TripStockAllocation } from '../models/trip-stock-allocation';

@Injectable({
  providedIn: 'root'
})
export class TripAllocationService {
  private firestore = inject(Firestore);
  private allocationsCollection = collection(this.firestore, 'tripStockAllocations');

  getAllocationsForTrip(tripId: string): Observable<TripStockAllocation[]> {
    const q = query(this.allocationsCollection, where('tripId', '==', tripId), orderBy('product.name'));
    return collectionData(q, { idField: 'id' }) as Observable<TripStockAllocation[]>;
  }

  getAllocationsByUser(userId: string): Observable<TripStockAllocation[]> {
    const q = query(this.allocationsCollection, where('userId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<TripStockAllocation[]>;
  }
  getAllAllocations(): Observable<TripStockAllocation[]> {
    return collectionData(this.allocationsCollection, { idField: 'id' }) as Observable<TripStockAllocation[]>;
  }

  async addAllocation(allocation: TripStockAllocation): Promise<void> {
    await addDoc(this.allocationsCollection, allocation as any);
  }

  async updateAllocation(allocationId: string, allocation: Partial<TripStockAllocation>): Promise<void> {
    const docRef = doc(this.firestore, `tripStockAllocations/${allocationId}`);
    await updateDoc(docRef, allocation as any);
  }

  async deleteAllocation(allocationId: string): Promise<void> {
    const docRef = doc(this.firestore, `tripStockAllocations/${allocationId}`);
    await deleteDoc(docRef);
  }
}
