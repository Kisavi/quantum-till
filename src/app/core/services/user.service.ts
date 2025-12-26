import { inject, Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import {
  addDoc,
  collection,
  collectionData,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  getDocs,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Invitation } from '../models/invitation';
import { RoleName } from '../models/role-name';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private usersCollectionRef = collection(this.firestore, 'users') as CollectionReference<User>;
  invitationsCollectionRef = collection(
    this.firestore,
    'invitations',
  ) as CollectionReference<Invitation>;

  inviteUser(email: string, role: RoleName): Promise<DocumentReference<Invitation>> {
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

  async createUser(email: string, password: string, displayName: string): Promise<void> {
    // Check for invitation
    const invitation = await this.getInvitation(email);

    if (!invitation) {
      throw new Error('No invitation found for this email address');
    }

    // Create the user account
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const user = userCredential.user;

    try {
      // Update display name
      await updateProfile(user, { displayName });

      // Use a batch to ensure atomicity
      const batch = writeBatch(this.firestore);

      // Update invitation status
      batch.update(invitation.ref, { accepted: true });

      // Create user document
      const userDocRef = doc(this.firestore, 'users', user.uid);
      batch.set(userDocRef, {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        photoURL: user.photoURL,
        active: true,
        valid: true,
        rating: 0,
        role: invitation.data().role,
        createdAt: serverTimestamp(),
      });

      // Commit all operations atomically
      await batch.commit();
    } catch (error) {
      // Clean up: delete the auth user if any operation fails
      await user.delete().catch(console.error);
      throw error;
    }
  }

  getUsers(): Observable<User[]> {
    return collectionData(this.usersCollectionRef);
  }

  changeUserActiveStatus(uid: string, active: boolean): Promise<any> {
    const userDocRef = doc(this.usersCollectionRef, uid);
    return updateDoc(userDocRef, { active });
  }
}
