import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { CreateTripDto, Trip } from '../models/trip';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private firestore = inject(Firestore);
  private tripsRef = collection(this.firestore, 'trips');

  getAllTrips(): Observable<Trip[]> {
  const q = query(
    this.tripsRef,
    orderBy('createdOn', 'desc')
  );

  return collectionData(this.tripsRef, { idField: 'id' }) as Observable<Trip[]>;
}

  createTrip(trip: CreateTripDto) {
    return addDoc(this.tripsRef, trip);
  }

  updateTrip(tripId: string, data: Partial<Trip>) {
    const ref = doc(this.firestore, `trips/${tripId}`);
    return updateDoc(ref, data);
  }

  getTripsByUser(userId: string): Observable<Trip[]> {
    const q = query(
      this.tripsRef,
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Trip[]>;
  }
}
