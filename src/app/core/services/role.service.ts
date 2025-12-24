import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  Firestore,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Role } from '../models/role';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private firestore = inject(Firestore);
  private rolesCollectionRef = collection(this.firestore, 'roles') as CollectionReference<Role>;

  createRole(role: Role): Promise<DocumentReference<Role>> {
    return addDoc(this.rolesCollectionRef, role);
  }

  getRoles(): Observable<Role[]> {
    return collectionData(this.rolesCollectionRef);
  }

  removeRole(roleId: string): Promise<any> {
    const userDoc = doc(this.rolesCollectionRef, roleId);
    return deleteDoc(userDoc);
  }
}
