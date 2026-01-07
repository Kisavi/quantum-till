import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { redirectLoggedInToRoleDashboard, roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [redirectLoggedInToRoleDashboard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.routes),
  },

  {
    path: 'user-validation',
    loadComponent: () =>
      import('./features/user-validation/user-validation.component').then(
        (m) => m.UserValidationComponent,
      ),
  },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/dashboards/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'distributor/dashboard',
        canActivate: [roleGuard(['RIDER'])],
        loadComponent: () =>
          import('./features/dashboards/distributor-dashboard/distributor-dashboard.component').then(
            (m) => m.DistributorDashboardComponent,
          ),
      },


      {
        path: 'distributors',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/distributors/distributors.component').then(
            (m) => m.DistributorsComponent,
          ),
      },
      {
        path: 'trips',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/trip/trips/trips.component').then((m) => m.TripsComponent),
      },
      {
        path: 'routes',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/distribution-routes/distribution-route-list/distribution-route-list.component').then(
            (m) => m.DistributionRouteListComponent,
          ),
      },
      {
        path: 'products',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/products/product-list/product-list.component').then(
            (m) => m.ProductListComponent,
          ),
      },
      {
        path: 'stock',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/stock/stock-list/stock-list.component').then(
            (m) => m.StockListComponent,
          ),
      },
      {
        path: 'assets',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/assets/assets.component').then((m) => m.AssetsComponent),
      },
      {
        path: 'inventory',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard(['ADMIN', 'MANAGER'])],
        loadComponent: () =>
          import('./features/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },

      // Shared routes for all authenticated users
      {
        path: 'customers',
        canActivate: [roleGuard(['ADMIN', 'MANAGER', 'RIDER'])],
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list.component').then(
            (m) => m.CustomerListComponent,
          ),
      },
      {
        path: 'sales',
        canActivate: [roleGuard(['ADMIN', 'MANAGER', 'RIDER'])],
        loadChildren: () => import('./features/sales/sales.routes').then((m) => m.routes),
      },
      {
        path: 'expenses',
        canActivate: [roleGuard(['ADMIN', 'MANAGER', 'RIDER'])],
        loadComponent: () =>
          import('./features/expense/expense.component').then((m) => m.ExpenseComponent),
      },
      {
        path: 'returns',
        canActivate: [roleGuard(['ADMIN', 'MANAGER', 'RIDER'])],
        loadComponent: () =>
          import('./features/returns/returns.component').then((m) => m.ReturnsComponent),
      },

      // Default redirects
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