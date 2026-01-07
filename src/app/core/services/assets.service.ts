// core/services/assets.service.ts

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
import { Asset } from '../models/assets';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {
  private firestore = inject(Firestore);
  private assetsCollection = collection(this.firestore, 'assets');

  getAssets(): Observable<Asset[]> {
    return collectionData(this.assetsCollection, { idField: 'id' }) as Observable<Asset[]>;
  }

  async addAsset(data: any): Promise<void> {
    await addDoc(this.assetsCollection, data);
  }
  async updateAsset(id: string, data: any): Promise<void> {
    const assetRef = doc(this.firestore, 'assets', id);
    await updateDoc(assetRef, data);
  }

  async deleteAsset(id: string): Promise<void> {
    const assetRef = doc(this.firestore, 'assets', id);
    await deleteDoc(assetRef);
  }
}