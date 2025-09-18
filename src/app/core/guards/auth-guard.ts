import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  // const isLoggedIn = false;
  // return isLoggedIn;
  const router = inject(Router);
  return router.createUrlTree(['/auth']);
};
