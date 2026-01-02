import { Component, inject, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Auth } from '@angular/fire/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  imports: [MenuModule, BadgeModule, RippleModule, AvatarModule, CommonModule, RouterModule],
})
export class SideMenuComponent implements OnInit {
  auth = inject(Auth);
  router = inject(Router);
  userService = inject(UserService);

  items?: MenuItem[];

  isAdmin!: boolean;
  isManager!: boolean;

  ngOnInit(): void {
    this.userService.getCurrentUser().subscribe((currUser) => {
      this.isAdmin = currUser?.role === 'ADMIN';
      this.isManager = currUser?.role === 'MANAGER';

      this.items = [
        {
          label: 'Overview',
          items: [{ label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' }],
        },
        ...this.getOperationsMenuItems(),
        ...this.getInventoryMenuItems(),
        ...this.getPeopleMenuItems(),
        ...this.getAdministrationMenuItems(),
      ];
    });
  }

  getOperationsMenuItems() {
    const menu = {
      label: 'Operations',
      items: [
        { label: 'Sales', icon: 'pi pi-shopping-cart', routerLink: '/sales' },
        { label: 'Returns', icon: 'pi pi-undo', routerLink: '/returns' },
      ],
    };

    if (this.isAdmin || this.isManager) {
      menu.items.push(
        { label: 'Distributors', icon: 'pi pi-truck', routerLink: '/distributors' },
        { label: 'Trips', icon: 'pi pi-map', routerLink: '/trips' },
        { label: 'Routes', icon: 'pi pi-map-marker', routerLink: '/routes' },
      );
    }

    return [menu];
  }

  getInventoryMenuItems() {
    if (this.isAdmin || this.isManager) {
      return [
        {
          label: 'Inventory',
          items: [
            { label: 'Products', icon: 'pi pi-tags', routerLink: '/products' },
            { label: 'Stock', icon: 'pi pi-tags', routerLink: '/stock' },
            { label: 'Inventory', icon: 'pi pi-box', routerLink: '/inventory' },
          ],
        },
      ];
    }

    return [];
  }

  getPeopleMenuItems() {
    const menu = {
      label: 'People',
      items: [{ label: 'Customers', icon: 'pi pi-user-plus', routerLink: '/customers' }],
    };

    if (this.isAdmin || this.isManager) {
      menu.items.push({ label: 'Users', icon: 'pi pi-users', routerLink: '/users' });
    }

    return [menu];
  }

  getAdministrationMenuItems() {
    const menu = {
      label: 'Administration',
      items: [{ label: 'Expenses', icon: 'pi pi-wallet', routerLink: '/expenses' }],
    };

    if (this.isAdmin || this.isManager) {
      menu.items.push({ label: 'Assets', icon: 'pi pi-cog', routerLink: '/assets' });
    }

    return [menu];
  }
}
