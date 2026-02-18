import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {AuthAction} from '.';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { AuthenticationService } from '../../../core/services/authentication.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthEffects {
  login$;
  loginSuccess$;
  register$;
  logout$;
  autoLogin$;


  constructor(private actions$: Actions, private authService: AuthenticationService, private router: Router) {
    this.login$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthAction.login),
        mergeMap((credentials) =>
          this.authService.login(credentials.email, credentials.password).pipe(
            map(auth => AuthAction.loginSuccess({ auth, fromAutoLogin: false })),
            catchError(error => of(AuthAction.loginFailure({ error: error.message || 'Failed to login' })))
          )
        )
      )
    );

    this.register$ = createEffect(() =>
      this.actions$.pipe(
        ofType(AuthAction.register),
        mergeMap((registration) =>
          this.authService.register(registration.registration).pipe(
            map(message => AuthAction.registerSuccess({ message })),
            catchError(error => of(AuthAction.registerFailure({ error: error.message || 'Failed to login' })))
          )
        )
      )
    );

  this.loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthAction.loginSuccess),
      tap(({auth, fromAutoLogin}) => {
        localStorage.setItem('token', auth.token);
        localStorage.setItem('user', JSON.stringify(auth.user));
        if (!fromAutoLogin) {
          // Redirect admin users to /admin, regular users to /task
          if (auth.user?.roles?.includes('PASSWORD_ADMIN')) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/task']);
          }
        }
      })
    ),
    { dispatch: false }
  );
   
    this.logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthAction.logout),
        tap(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.authService.logout();
          this.router.navigate(['/login']);
        })
      ),
    { dispatch: false }
  );

  this.autoLogin$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AuthAction.init),
    map(() => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        return AuthAction.loginSuccess({
          auth: { token, user: JSON.parse(user) },
          fromAutoLogin: true,
        });
      } else {
        return AuthAction.logout();
      }
    })
  )
);
    
  }
}

