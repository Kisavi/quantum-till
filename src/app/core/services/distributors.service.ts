// src/app/core/services/distributor.service.ts

import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    CollectionReference,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Distributor } from '../models/distributor';

@Injectable({
    providedIn: 'root',
})
export class DistributorService {
    private firestore = inject(Firestore);

    private distributorsRef = collection(
        this.firestore,
        'distributors'
    ) as CollectionReference<Distributor>;

    getDistributors(): Observable<Distributor[]> {
        return collectionData(this.distributorsRef, {
            idField: 'id',
        }) as Observable<Distributor[]>;
    }

    createDistributor(distributor: Distributor): Promise<void> {
        const ref = doc(this.distributorsRef, String(distributor.id));
        return setDoc(ref, distributor);
    }

    updateDistributor(distributor: Distributor): Promise<void> {
        const ref = doc(this.distributorsRef, String(distributor.id));
        return updateDoc(ref, { ...distributor });
    }

    deleteDistributor(id: number): Promise<void> {
        const ref = doc(this.distributorsRef, String(id));
        return deleteDoc(ref);
    }
}
