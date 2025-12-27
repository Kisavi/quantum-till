import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  Firestore,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Customer } from '../models/customer';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private firestore = inject(Firestore);

  customersCollRef = collection(this.firestore, 'customers') as CollectionReference<Customer>;

  getCustomers(): Observable<Customer[]> {
    return collectionData(this.customersCollRef);
  }

  addCustomer(customer: Customer): Promise<void> {
    const docRef = doc(this.customersCollRef);
    customer.id = docRef.id;
    return setDoc(docRef, customer);
  }

  updateCustomer(id: string, customer: Partial<Customer>): Promise<void> {
    const docRef = doc(this.customersCollRef, id);
    return updateDoc(docRef, customer);
  }

  deleteCustomer(id: string): Promise<void> {
    const docRef = doc(this.customersCollRef, id);
    return deleteDoc(docRef);
  }
}
