import { createReducer, on } from '@ngrx/store';
import {AuthAction} from '.';
import { Task } from '../../../core/models/domain/task.model';
import { User } from '../../../core/models/domain/user.model';

export interface AuthState {
  user: User | null;
  token: string;
  loggedIn: boolean;
  loading: boolean;
  error: string | null;
}

export const initialState: AuthState = {
  user: null,
  token: '',
  loggedIn: false,
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthAction.login, (state) => ({ ...state, loading: true })),
  on(AuthAction.loginSuccess, (state, { auth }) => ({
    ...state,
    loading: false,
    loggedIn: true,
    error: null,
    user: auth.user,
    token: auth.token
  })),
  on(AuthAction.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(AuthAction.logout, ()=> initialState)
);