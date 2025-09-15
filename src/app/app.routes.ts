import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./staff/staff.routes').then((m) => m.routes),
  },
];
