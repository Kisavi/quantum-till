import { Routes } from '@angular/router';
import { AdminList } from './admin-list/admin-list';
import { RiderList } from './rider-list/rider-list';
import { StaffNav } from './staff-nav/staff-nav';

export const routes: Routes = [
  {
    path: '',
    component: StaffNav,
    children: [
      {
        path: '',
        component: AdminList,
      },
      {
        path: 'riders',
        component: RiderList,
        // loadComponent: () => import('./rider-list/rider-list').then((m) => m.RiderList),
      },
    ],
  },
];
