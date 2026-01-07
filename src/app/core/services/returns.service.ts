import { Injectable, inject } from '@angular/core';
import { ReturnItem } from '../models/return-item';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReturnsService {
  private firestore = inject(Firestore);
  private returnsRef = collection(this.firestore, 'returns');

  getAllReturns(): Observable<ReturnItem[]> {
    const q = query(
      this.returnsRef,
      orderBy('returnDate', 'desc')
    )
    return collectionData(q, { idField: 'id' }) as Observable<ReturnItem[]>;
  }

  //  get returns by user (for riders to see only their returns)
  getReturnsByUser(userId: string): Observable<ReturnItem[]> {
    const q = query(
      this.returnsRef,
      orderBy('returnDate', 'desc'),
      where('createdBy', '==', userId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<ReturnItem[]>;
  }

  // get trip specific returns
  getReturnsByTrip(tripId: string): Observable<ReturnItem[]> {
    const q = query(
      this.returnsRef,
      orderBy('returnDate', 'desc'),
      where('tripId', '==', tripId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<ReturnItem[]>;
  }

  async createReturn(returnItem: ReturnItem): Promise<void> {
    await addDoc(this.returnsRef, returnItem);
  }

  async updateReturn(returnItem: ReturnItem): Promise<void> {
    const docRef = doc(this.firestore, `returns/${returnItem.id}`);
    await updateDoc(docRef, returnItem as any);
  }

  async deleteReturn(id: string): Promise<void> {
    const docRef = doc(this.firestore, `returns/${id}`);
    await deleteDoc(docRef);
  }
}
