import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Menubar } from 'primeng/menubar';
import { map, Observable } from 'rxjs';
import { User } from '../../models/user';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  imports: [Menubar, BadgeModule, AvatarModule, InputTextModule, CommonModule, Menu, AsyncPipe],
})
export class TopBarComponent {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  currentUser$: Observable<User>;

  items: MenuItem[] = [
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => {
        this.signOut();
      },
    },
  ];

  constructor() {
    const currentUserDocRef = doc(this.firestore, `users/${this.auth.currentUser?.uid}`);
    this.currentUser$ = docData(currentUserDocRef).pipe(
      map((userInfo) => {
        return { ...this.auth.currentUser, ...userInfo } as User;
      })
    );
  }

  signOut(): void {
    signOut(this.auth).then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
