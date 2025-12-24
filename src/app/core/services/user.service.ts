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
  getDocs,
  query,
  QueryDocumentSnapshot,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Invitation } from '../models/invitation';
import { Role } from '../models/role';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  private usersCollectionRef = collection(this.firestore, 'users') as CollectionReference<User>;
  invitationsCollectionRef = collection(
    this.firestore,
    'invitations',
  ) as CollectionReference<Invitation>;

  inviteUser(email: string, role: Role): Promise<DocumentReference<Invitation>> {
    const docId = doc(this.invitationsCollectionRef).id;
    const invitation = { id: docId, email, role } as Invitation;
    return addDoc(this.invitationsCollectionRef, invitation);
  }

  async getInvitation(email: string | null): Promise<QueryDocumentSnapshot<Invitation> | null> {
    const q = query(this.invitationsCollectionRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const invitation = querySnapshot.docs[0];
      return invitation;
    } else {
      return null;
    }
  }

  createUser(uid: string, user: Partial<User>): Promise<void> {
    const userDoc = doc(this.firestore, 'users', uid);
    return setDoc(userDoc, user);
  }

  getUsers(): Observable<User[]> {
    return collectionData(this.usersCollectionRef);
  }

  removeUser(uid: string): Promise<any> {
    const userDoc = doc(this.usersCollectionRef, uid);
    return deleteDoc(userDoc);
  }
}
