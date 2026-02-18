import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectLoggedIn, selectLoggedInUser } from '../../sections/auth/store/auth.selectors';


export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  const isAuthenticated = store.selectSignal(selectLoggedIn);
  const user = store.selectSignal(selectLoggedInUser);

  // If not authenticated, redirect to login
  if (!isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // If user is admin (has PASSWORD_ADMIN role), block access to regular pages
  if (user() && user()?.roles?.includes('PASSWORD_ADMIN')) {
    return router.createUrlTree(['/admin']);
  }

  return true;
};