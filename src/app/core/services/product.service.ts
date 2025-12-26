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
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private firestore = inject(Firestore);

  productsCollRef = collection(this.firestore, 'products') as CollectionReference<Product>;

  getProducts(): Observable<Product[]> {
    return collectionData(this.productsCollRef);
  }

  addProduct(product: Product): Promise<void> {
    const docRef = doc(this.productsCollRef);
    product.id = docRef.id;
    return setDoc(docRef, product);
  }

  updateProduct(id: string, product: Partial<Product>): Promise<void> {
    const docRef = doc(this.productsCollRef, id);
    return updateDoc(docRef, product);
  }

  deleteProduct(id: string): Promise<void> {
    const docRef = doc(this.productsCollRef, id);
    return deleteDoc(docRef);
  }
}
