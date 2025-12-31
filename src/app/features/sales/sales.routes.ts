import { Routes } from '@angular/router';
import { SalesHistoryComponent } from './sales-history/sales-history.component';
import { SellComponent } from './sell/sell.component';
import { SalesLayoutComponent } from './sales-layout/sales-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: SalesLayoutComponent,
    children: [
      {
        path: 'sell',
        component: SellComponent,
      },
      {
        path: 'history',
        component: SalesHistoryComponent,
      },
      {
        path: '',
        redirectTo: 'sell',
        pathMatch: 'full',
      },
    ],
  },
];
