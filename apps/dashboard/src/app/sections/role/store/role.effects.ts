import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {RoleActions} from '.';
import { catchError, map, mergeMap, of, tap } from 'rxjs';
import { RoleApiService } from '../../../core/services/role-api.service';

@Injectable()
export class RoleEffects {
  getRoles$;
  addRole$;
  updateRole$;
  deleteRole$;

  constructor(private actions$: Actions, private roleService: RoleApiService) {
    this.getRoles$ = createEffect(() =>
      this.actions$.pipe(
        ofType(RoleActions.getRoles),
        mergeMap(() =>
          this.roleService.getAllRoles().pipe(
            map(roles => RoleActions.getRolesSuccess({ roles })),
            catchError(error => of(RoleActions.getRolesFailure({ error: error.message || 'Failed to load roles' })))
          )
        )
      )
    );

    this.addRole$ = createEffect(() =>
            this.actions$.pipe(
              ofType(RoleActions.addRole),
              mergeMap((role) =>
                this.roleService.addRole(role.role).pipe(
                  map((role) => RoleActions.addRoleSuccess({role})),
                  catchError(error => of(RoleActions.addRoleFailure({ error: error.message || 'Failed to add role' })))
                )
              )
            )
        );
    
        this.updateRole$ = createEffect(() =>
            this.actions$.pipe(
              ofType(RoleActions.updateRole),
              mergeMap((role) =>
                this.roleService.updateRole(role.role).pipe(
                  map(role => RoleActions.updateRoleSuccess({role})),
                  catchError(error => of(RoleActions.updateRoleFailure({ error: error.message || 'Failed to update role' })))
                )
              )
            )
        );
    
        this.deleteRole$ = createEffect(() =>
            this.actions$.pipe(
              ofType(RoleActions.deleteRole),
              mergeMap((role) =>
                this.roleService.deleteRole(role.role).pipe(
                  map(role => RoleActions.deleteRoleSuccess({role})),
                  catchError(error => of(RoleActions.deleteRoleFailure({ error: error.message || 'Failed to delete role' })))
                )
              )
            )
        );
    
  }
}

