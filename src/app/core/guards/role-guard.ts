// core/guards/role.guard.ts

import { inject, runInInjectionContext, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { map, switchMap, take } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { authState } from '@angular/fire/auth';
import { RoleName as Role } from '../models/role-name';


function dashboardForRole(role?: Role): string[] {
  switch (role) {
    case 'ADMIN':
    case 'MANAGER':
      return ['/dashboard'];
    case 'RIDER':
      return ['/distributor/dashboard'];
    case 'COOK':
      return ['/cook/dashboard'];
    default:
      return ['/user-validation'];
  }
}

/**
 * Guard: allow only logged-in users with one of the allowed roles.
 * - Not logged in -> /auth
 * - Logged in but wrong role -> redirect to their dashboard
 */
export const roleGuard = (allowedRoles: Role[]): CanActivateFn => {
  return () => {
    const injector = inject(Injector);
    const router = inject(Router);
    const auth = inject(Auth);
    const firestore = inject(Firestore);

    return authState(auth).pipe(
      take(1),
      switchMap((user) => {
        // Not logged in
        if (!user) {
          return of(router.createUrlTree(['/auth']));
        }

        return runInInjectionContext(injector, () => {
          const userDocRef = doc(firestore, 'users', user.uid);
          
          return from(getDoc(userDocRef)).pipe(
            map((userDoc) => {
              // User document doesn't exist
              if (!userDoc.exists()) {
                return router.createUrlTree(['/user-validation']);
              }

              const userData = userDoc.data();
              const userRole = userData['role'] as Role | undefined;

              // Check if user's role is allowed and allow access
              if (userRole && allowedRoles.includes(userRole)) {
                return true;
              }

              // Redirect to appropriate dashboard for their role
              return router.createUrlTree(dashboardForRole(userRole));
            })
          );
        });
      })
    );
  };
};

/**
 * Guard: used on /auth route.
 * - If NOT logged in -> allow to see auth pages
 * - If logged in -> redirect to dashboard by role
 */
export const redirectLoggedInToRoleDashboard: CanActivateFn = () => {
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = inject(Auth);
  const firestore = inject(Firestore);

  return authState(auth).pipe(
    take(1),
    switchMap((user) => {
      // Not logged in - allow access to auth pages
      if (!user) {
        return of(true);
      }

      return runInInjectionContext(injector, () => {
        const userDocRef = doc(firestore, 'users', user.uid);
        
        return from(getDoc(userDocRef)).pipe(
          map((userDoc) => {
            if (!userDoc.exists()) {
              return router.createUrlTree(['/user-validation']);
            }

            const userData = userDoc.data();
            const userRole = userData['role'] as Role | undefined;

            // Redirect to their dashboard
            return router.createUrlTree(dashboardForRole(userRole));
          })
        );
      });
    })
  );
};