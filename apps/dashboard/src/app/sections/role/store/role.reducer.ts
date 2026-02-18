import { createReducer, on } from '@ngrx/store';
import {RoleActions} from '.';
import { Role } from '../../../core/models/domain/role.model';

export interface RoleState {
  roles: Role[];
  loading: boolean;
  error: string | null;
}

export const initialState: RoleState = {
  roles: [],
  loading: false,
  error: null,
};

export const roleReducer = createReducer(
  initialState,
  on(RoleActions.getRoles, (state) => ({ ...state, loading: true })),
  on(RoleActions.getRolesSuccess, (state, { roles }) => ({
    ...state,
    loading: false,
    roles,
  })),
  on(RoleActions.getRolesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(RoleActions.addRoleSuccess, (state, { role }) => ({
      ...state,
      loading: false,
      roles: [...state.roles, role],
    })),
    on(RoleActions.updateRoleSuccess, (state, { role }) => ({
      ...state,
      loading: false,
      roles: state.roles.map(r =>
        r.id === role.id ? role : r
      )
    })),
    on(RoleActions.deleteRoleSuccess, (state, { role }) => ({
      ...state,
      loading: false,
      roles: state.roles.filter(r => r.id !== role.id)
    }))
);