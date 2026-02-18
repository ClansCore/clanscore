import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectLoggedIn, selectLoggedInUser } from '../../sections/auth/store/auth.selectors';

export const loggedOutGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  
  const isAuthenticated = store.selectSignal(selectLoggedIn);
  const user = store.selectSignal(selectLoggedInUser);
  
  if (isAuthenticated() === false) {
    return true;
  }
  
  // Redirect admin users to /admin, regular users to /task
  if (user() && user()?.roles?.includes('PASSWORD_ADMIN')) {
    return router.createUrlTree(['/admin']);
  }
  
  return router.createUrlTree(['/task']);
};
