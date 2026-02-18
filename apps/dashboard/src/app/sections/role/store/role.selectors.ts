import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RoleState } from './role.reducer';

export const selectRoleState = createFeatureSelector<RoleState>('role');

export const selectRoles = createSelector(selectRoleState, (state) => state.roles);
export const selectRolesLoading = createSelector(selectRoleState, (state) => state.loading);
export const selectRolesError = createSelector(selectRoleState, (state) => state.error);