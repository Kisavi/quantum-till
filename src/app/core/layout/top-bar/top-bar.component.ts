import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Auth, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { InputTextModule } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { Menubar } from 'primeng/menubar';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  imports: [Menubar, BadgeModule, AvatarModule, InputTextModule, CommonModule, Menu, AsyncPipe],
})
export class TopBarComponent {
  private auth = inject(Auth);
  private router = inject(Router);
  private userService = inject(UserService);

  currentUser$ = this.userService.getCurrentUser();

  items: MenuItem[] = [
    {
      label: 'Sign Out',
      icon: 'pi pi-sign-out',
      command: () => {
        this.signOut();
      },
    },
  ];

  signOut(): void {
    signOut(this.auth).then(() => {
      this.router.navigate(['/auth/login']);
    });
  }
}
