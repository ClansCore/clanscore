import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UserState } from './user.reducer';

export const selectUsersState = createFeatureSelector<UserState>('user');

export const selectUsers = createSelector(selectUsersState, (state) => state.users);
export const selectUserLoading = createSelector(selectUsersState, (state) => state.loading);
export const selectUserError = createSelector(selectUsersState, (state) => state.error);