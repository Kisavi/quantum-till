// core/layout/side-menu/side-menu.component.ts

import { Component, inject, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

type Role = 'ADMIN' | 'MANAGER' | 'RIDER' | 'COOK';

interface MenuItemWithRoles extends MenuItem {
  roles?: Role[];
  items?: MenuItemWithRoles[];
}

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  imports: [MenuModule, BadgeModule, RippleModule, AvatarModule, CommonModule, RouterModule],
})
export class SideMenuComponent implements OnInit {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  userRole: Role | null = null;
  visibleItems: MenuItem[] = [];

  // Defined menu items with role restrictions
  private allMenuItems: MenuItemWithRoles[] = [
    {
      label: 'Overview',
      items: [
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: '/dashboard',
          roles: ['ADMIN', 'MANAGER']
        },
        {
          label: 'My Dashboard',
          icon: 'pi pi-chart-line',
          routerLink: '/distributor/dashboard',
          roles: ['RIDER']
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          label: 'Sales',
          icon: 'pi pi-shopping-cart',
          routerLink: '/sales',
          roles: ['ADMIN', 'MANAGER', 'RIDER']
        },
        {
          label: 'Returns',
          icon: 'pi pi-undo',
          routerLink: '/returns',
          roles: ['ADMIN', 'MANAGER', 'RIDER']
        },
        {
          label: 'Distributors',
          icon: 'pi pi-truck',
          routerLink: '/distributors',
          roles: ['ADMIN', 'MANAGER']
        },
        {
          label: 'Trips',
          icon: 'pi pi-map',
          routerLink: '/trips',
          roles: ['ADMIN', 'MANAGER']
        },
        {
          label: 'Routes',
          icon: 'pi pi-map-marker',
          routerLink: '/routes',
          roles: ['ADMIN', 'MANAGER']
        },
      ],
    },
    {
      label: 'Inventory',
      items: [
        {
          label: 'Products',
          icon: 'pi pi-tags',
          routerLink: '/products',
          roles: ['ADMIN', 'MANAGER']
        },
        {
          label: 'Stock',
          icon: 'pi pi-tags',
          routerLink: '/stock',
          roles: ['ADMIN', 'MANAGER']
        },
        {
          label: 'Inventory',
          icon: 'pi pi-box',
          routerLink: '/inventory',
          roles: ['ADMIN', 'MANAGER']
        },
      ],
    },
    {
      label: 'People',
      items: [
        {
          label: 'Customers',
          icon: 'pi pi-user-plus',
          routerLink: '/customers',
          roles: ['ADMIN', 'MANAGER', 'RIDER']
        },
        {
          label: 'Users',
          icon: 'pi pi-users',
          routerLink: '/users',
          roles: ['ADMIN', 'MANAGER']
        },
      ],
    },
    {
      label: 'Administration',
      items: [
        {
          label: 'Expenses',
          icon: 'pi pi-wallet',
          routerLink: '/expenses',
          roles: ['ADMIN', 'MANAGER', 'RIDER']
        },
        {
          label: 'Assets',
          icon: 'pi pi-cog',
          routerLink: '/assets',
          roles: ['ADMIN', 'MANAGER']
        },
      ],
    },
  ];

  async ngOnInit() {
    await this.loadUserRole();
    this.filterMenuItems();
  }

  private async loadUserRole(): Promise<void> {
    const user = this.auth.currentUser;

    if (!user) {
      this.userRole = null;
      return;
    }

    try {
      const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));

      if (userDoc.exists()) {
        this.userRole = userDoc.data()['role'] as Role;
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      this.userRole = null;
    }
  }

  private filterMenuItems(): void {
    if (!this.userRole) {
      this.visibleItems = [];
      return;
    }

    this.visibleItems = this.allMenuItems
      .map(section => {
        // Filter items in each section
        const filteredItems = section.items?.filter(item =>
          !item.roles || item.roles.includes(this.userRole!)
        );

        // Only return section if it has visible items
        if (filteredItems && filteredItems.length > 0) {
          return {
            ...section,
            items: filteredItems
          };
        }

        return null;
      })
      .filter(section => section !== null) as MenuItem[];
  }
}