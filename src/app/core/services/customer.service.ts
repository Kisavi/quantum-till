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
import { firstValueFrom, Observable } from 'rxjs';
import { Customer } from '../models/customer';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private firestore = inject(Firestore);
  private userService = inject(UserService);

  customersCollRef = collection(this.firestore, 'customers') as CollectionReference<Customer>;

  getCustomers(): Observable<Customer[]> {
    return collectionData(this.customersCollRef);
  }

  async addCustomer(customer: Customer): Promise<void> {
    const currentUser = await firstValueFrom(this.userService.getCurrentUser());

    if (!currentUser) {
      throw new Error('Current user not found');
    }

    const docRef = doc(this.customersCollRef);
    customer.id = docRef.id;
    customer.createdBy = currentUser;
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
