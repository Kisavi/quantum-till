// core/services/distributors.service.ts

import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Distributor } from '../models/distributor';

@Injectable({
  providedIn: 'root'
})
export class DistributorService {
  private firestore = inject(Firestore);
  private distributorsCollection = collection(this.firestore, 'distributors');

  getDistributors(): Observable<Distributor[]> {
    return collectionData(this.distributorsCollection, { idField: 'id' }) as Observable<Distributor[]>;
  }

  async addDistributor(data: any): Promise<void> {
    await addDoc(this.distributorsCollection, data);
  }

  async updateDistributor(id: string, data: any): Promise<void> {
    const distributorRef = doc(this.firestore, 'distributors', id);
    await updateDoc(distributorRef, data);
  }

  async deleteDistributor(id: string): Promise<void> {
    const distributorRef = doc(this.firestore, 'distributors', id);
    await deleteDoc(distributorRef);
  }
}