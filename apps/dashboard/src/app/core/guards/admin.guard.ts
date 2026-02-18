import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectLoggedInUser } from '../../sections/auth/store/auth.selectors';

export const adminGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  const user = store.selectSignal(selectLoggedInUser);

  // Check if user is logged in and has PASSWORD_ADMIN role
  if (user() && user()?.roles?.includes('PASSWORD_ADMIN')) {
    return true;
  }

  // Redirect to login if not admin
  return router.createUrlTree(['/login']);
};
