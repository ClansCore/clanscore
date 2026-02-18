import { createReducer, on } from '@ngrx/store';
import * as UserActions from './user.actions';
import { User } from '../../../core/models/domain/user.model';

export interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
};

export const userReducer = createReducer(
  initialState,
  on(UserActions.getAllUsers, (state) => ({ ...state, loading: true })),
  on(UserActions.getAllUsersSuccess, (state, { users }) => ({
    ...state,
    loading: false,
    users,
  })),
  on(UserActions.getAllUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UserActions.addUserSuccess, (state, { user }) => ({
    ...state,
    loading: false,
    users: [...state.users, user],
  })),
  on(UserActions.updateUserSuccess, (state, { user }) => ({
    ...state,
    loading: false,
    users: state.users.map(u =>
      u.id === user.id ? user : u
    )
  })),
  on(UserActions.deleteUserSuccess, (state, { user }) => ({
    ...state,
    loading: false,
    users: state.users.filter(u => u.id !== user.id)
  })),
  on(UserActions.setUserPassword, (state) => ({ ...state, loading: true, error: null })),
  on(UserActions.setUserPasswordSuccess, (state) => ({
    ...state,
    loading: false,
    error: null,
  })),
  on(UserActions.setUserPasswordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(UserActions.changeOwnPassword, (state) => ({ ...state, loading: true, error: null })),
  on(UserActions.changeOwnPasswordSuccess, (state) => ({
    ...state,
    loading: false,
    error: null,
  })),
  on(UserActions.changeOwnPasswordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);