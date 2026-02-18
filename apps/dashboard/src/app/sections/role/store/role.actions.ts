import { createAction, props } from '@ngrx/store';
import { Role } from '../../../core/models/domain/role.model';

export const getRoles = createAction('[Role] GetRoles');
export const getRolesSuccess = createAction('[Role] GetRoles Success', props<{ roles: Role[] }>());
export const getRolesFailure = createAction('[Role] GetRoles Failure', props<{ error: string }>());

export const addRole = createAction('[Role] AddRole', props<{ role: Role }>());
export const addRoleSuccess = createAction('[Role] AddRole Success', props<{ role: Role }>());
export const addRoleFailure = createAction('[Role] AddRole Failure', props<{ error: string }>());

export const updateRole = createAction('[Role] UpdateRole', props<{ role: Role }>());
export const updateRoleSuccess = createAction('[Role] UpdateRole Success', props<{ role: Role }>());
export const updateRoleFailure = createAction('[Role] UpdateRole Failure', props<{ error: string }>());

export const deleteRole = createAction('[Role] DeleteRole', props<{ role: Role }>());
export const deleteRoleSuccess = createAction('[Role] DeleteRole Success', props<{ role: Role }>());
export const deleteRoleFailure = createAction('[Role] DeleteRole Failure', props<{ error: string }>());