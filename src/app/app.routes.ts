import { Routes } from '@angular/router';
import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [AuthGuard],
    data: { authGuardPipe: () => redirectLoggedInTo(['/dashboard']) },
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: '',
    canActivate: [AuthGuard],
    data: { authGuardPipe: () => redirectUnauthorizedTo(['/auth']) },
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'distributors',
        loadComponent: () =>
          import('./features/distributors/distributors.component').then((m) => m.DistributorsComponent), 
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./features/trips/trips.component').then((m) => m.TripsComponent),
      },
      {
        path: 'assets',
        loadComponent: () =>
          import('./features/assets/assets.component').then((m) => m.AssetsComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
];
