import { Routes } from '@angular/router';
import { SalesHistoryComponent } from './sales-history/sales-history.component';
import { SellComponent } from './sell/sell.component';

export const routes: Routes = [
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
];
