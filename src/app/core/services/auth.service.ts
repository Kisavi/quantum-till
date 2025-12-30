import { Injectable } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

export interface AppUser {
  uid: string;
  name: string;
  email?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user$;

  constructor(private auth: Auth) {
    // Initialize the observable here, after auth is available
    this.user$ = user(this.auth);
  }

  async getCurrentUser(): Promise<AppUser> {
    const authUser: User | null = await firstValueFrom(this.user$);

    if (!authUser) {
      throw new Error('User not authenticated');
    }

    return {
      uid: authUser.uid,
      name: authUser.displayName || 'Unknown User',
      email: authUser.email
    };
  }

  get currentUserSnapshot(): AppUser | null {
    const u = this.auth.currentUser;
    if (!u) return null;

    return {
      uid: u.uid,
      name: u.displayName || 'Unknown User',
      email: u.email
    };
  }
}
