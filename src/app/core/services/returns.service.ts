import { Injectable, inject } from '@angular/core';
import { ReturnItem } from '../models/return-item';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReturnsService {
  private firestore = inject(Firestore);
  private returnsRef = collection(this.firestore, 'returns');

  getAllReturns(): Observable<ReturnItem[]> {
    return collectionData(this.returnsRef, { idField: 'id' }) as Observable<ReturnItem[]>;
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
