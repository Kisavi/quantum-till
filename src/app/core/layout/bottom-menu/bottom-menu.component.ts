import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from "@angular/router";

@Component({
  selector: 'app-bottom-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-menu.component.html',
})
export class BottomMenuComponent {
  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
    { label: 'Sales', icon: 'pi pi-shopping-cart', routerLink: '/sales' },
    { label: 'Returns', icon: 'pi pi-undo', routerLink: '/returns' },
    { label: 'Customers', icon: 'pi pi-user-plus', routerLink: '/customers' },
  ];
}
