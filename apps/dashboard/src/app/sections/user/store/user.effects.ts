import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {UserActions} from './';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { UserApiService } from '../../../core/services/user-api.service';

@Injectable()
export class UserEffects {
  getUsers$;
  addUser$;
  updateUser$;
  deleteUser$;
  setUserPassword$;
  changeOwnPassword$;

  constructor(private actions$: Actions, private userService: UserApiService) {
    this.getUsers$ = createEffect(() =>
      this.actions$.pipe(
        ofType(UserActions.getAllUsers),
        mergeMap(() =>
          this.userService.getAll().pipe(
            map(users => UserActions.getAllUsersSuccess({ users })),
            catchError(error => of(UserActions.getAllUsersFailure({ error: error.message || 'Failed to load users' })))
          )
        )
      )
    );

    this.addUser$ = createEffect(() =>
        this.actions$.pipe(
          ofType(UserActions.addUser),
          mergeMap((user) =>
            this.userService.addMember(user.user).pipe(
              map(user => UserActions.addUserSuccess({user})),
              catchError(error => of(UserActions.addUserFailure({ error: error.message || 'Failed to add user' })))
            )
          )
        )
    );

    this.updateUser$ = createEffect(() =>
        this.actions$.pipe(
          ofType(UserActions.updateUser),
          mergeMap((user) =>
            this.userService.updateMember(user.user).pipe(
              map(user => UserActions.updateUserSuccess({user})),
              catchError(error => of(UserActions.updateUserFailure({ error: error.message || 'Failed to update user' })))
            )
          )
        )
    );

    this.deleteUser$ = createEffect(() =>
        this.actions$.pipe(
          ofType(UserActions.deleteUser),
          mergeMap((user) =>
            this.userService.deleteMember(user.user).pipe(
              map(user => UserActions.deleteUserSuccess({user})),
              catchError(error => of(UserActions.deleteUserFailure({ error: error.message || 'Failed to delete user' })))
            )
          )
        )
    );

    this.setUserPassword$ = createEffect(() =>
        this.actions$.pipe(
          ofType(UserActions.setUserPassword),
          mergeMap(({ userId, password }) =>
            this.userService.setUserPassword(userId, password).pipe(
              map(response => UserActions.setUserPasswordSuccess({ userId, message: response.message || 'Password set successfully' })),
              catchError(error => of(UserActions.setUserPasswordFailure({ error: error?.error?.message || error?.message || 'Failed to set password' })))
            )
          )
        )
    );

    this.changeOwnPassword$ = createEffect(() =>
        this.actions$.pipe(
          ofType(UserActions.changeOwnPassword),
          mergeMap(({ password, currentPassword }) =>
            this.userService.changeOwnPassword(password, currentPassword).pipe(
              map(response => UserActions.changeOwnPasswordSuccess({ message: response.message || 'Password changed successfully' })),
              catchError(error => of(UserActions.changeOwnPasswordFailure({ error: error?.error?.message || error?.message || 'Failed to change password' })))
            )
          )
        )
    );
    
  }
}

