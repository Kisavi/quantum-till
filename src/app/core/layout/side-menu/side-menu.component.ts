

import { Component, inject, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { Auth } from '@angular/fire/auth';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-side-menu',
    templateUrl: './side-menu.component.html',
    imports: [MenuModule, BadgeModule, RippleModule, AvatarModule, CommonModule, RouterModule]
})
export class SideMenuComponent implements OnInit {
    items: MenuItem[] | undefined;
    auth = inject(Auth);
    router = inject(Router);

    logout() {
        this.auth.signOut().then(() => {
            this.router.navigate(['/auth/login']);
        });
    }

    ngOnInit() {
        this.items = [
            { separator: true },
            {
                label: 'Overview', items: [
                    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
                ]
            },
            {
                label: 'Operations', items: [
                    { label: 'Sales', icon: 'pi pi-shopping-cart', routerLink: '/sales' },
                    { label: 'Returns', icon: 'pi pi-undo', routerLink: '/returns' },
                    { label: 'Distributors', icon: 'pi pi-truck', routerLink: '/distributors' },
                    { label: 'Trips', icon: 'pi pi-map', routerLink: '/trips' },
                    { label: 'Routes', icon: 'pi pi-map-marker', routerLink: '/routes' },
                ]
            },
            {
                label: 'Inventory', items: [
                    { label: 'Products', icon: 'pi pi-tags', routerLink: '/products' },
                    { label: 'Inventory', icon: 'pi pi-box', routerLink: '/inventory' },
                ]
            },
            {
                label: 'People', items: [
                    { label: 'Customers', icon: 'pi pi-user-plus', routerLink: '/customers' },
                    { label: 'Users', icon: 'pi pi-users', routerLink: '/users' },
                ]
            },
            {
                label: 'Administration', items: [
                    { label: 'Roles', icon: 'pi pi-shield', routerLink: '/roles' },
                    { label: 'Expenses', icon: 'pi pi-wallet', routerLink: '/expenses' },
                    { label: 'Assets', icon: 'pi pi-cog', routerLink: '/assets' },
                ]
            },
            { separator: true },
            {
                label: '', items: [
                    { label: 'Sign Out', icon: 'pi pi-sign-out', command: () => this.logout() },
                ]
            }
        ];

    }
}
