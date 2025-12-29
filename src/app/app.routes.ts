import { AuthGuard, redirectLoggedInTo, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [AuthGuard],
    data: { authGuardPipe: () => redirectLoggedInTo(['/dashboard']) },
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },
  {
    path: 'user-validation',
    data: { authGuardPipe: () => redirectUnauthorizedTo(['/auth']) },
    loadComponent: () =>
      import('./features/user-validation/user-validation.component').then(
        (m) => m.UserValidationComponent,
      ),
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
          import('./features/distributors/distributors.component').then(
            (m) => m.DistributorsComponent,
          ),
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./features/trips/trips.component').then((m) => m.TripsComponent),
      },
      {
        path: 'routes',
        loadComponent: () =>
          import('./features/distribution-routes/distribution-route-list/distribution-route-list.component').then(
            (m) => m.DistributionRouteListComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list.component').then(
            (m) => m.CustomerListComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.routes').then((m) => m.routes),
      },
      {
        path: 'assets',
        loadComponent: () =>
          import('./features/assets/assets.component').then((m) => m.AssetsComponent),
      },
      {
        path: 'expenses',
        loadComponent: () =>
          import('./features/expense/expense.component').then((m) => m.ExpenseComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('./features/returns/returns.component').then((m) => m.ReturnsComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: '',
        redirectTo: 'user-validation',
        pathMatch: 'full',
      },
      {
        path: '**',
        redirectTo: 'user-validation',
        pathMatch: 'full',
      },
    ],
  },
];
