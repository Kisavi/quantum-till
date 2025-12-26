import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  collectionSnapshots,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { DistributionRoute } from '../models/distribution-route';

@Injectable({
  providedIn: 'root',
})
export class DistributionRouteService {
  private firestore = inject(Firestore);

  distRoutesCollRef = collection(
    this.firestore,
    'distribution-routes',
  ) as CollectionReference<DistributionRoute>;

  getDistributionRoutes(): Observable<DistributionRoute[]> {
    return collectionData(this.distRoutesCollRef);
  }

  addDistributionRoute(route: DistributionRoute): Promise<void> {
    const docRef = doc(this.distRoutesCollRef);
    route.id = docRef.id;
    return setDoc(docRef, route);
  }

  updateDistributionRoute(id: string, route: Partial<DistributionRoute>): Promise<void> {
    const docRef = doc(this.distRoutesCollRef, id);
    return updateDoc(docRef, route);
  }

  deleteDistributionRoute(id: string): Promise<void> {
    const docRef = doc(this.distRoutesCollRef, id);
    return deleteDoc(docRef);
  }
}
