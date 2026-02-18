import { createAction, props } from '@ngrx/store';
import { Task } from '../../../core/models/domain/task.model';
import { Auth } from '../../../core/models/domain/auth.model';
import { User } from '../../../core/models/domain/user.model';
import { Registration } from '../../../core/models/domain/registration.model';

export const login = createAction('[Auth] Login', props<{email: string, password: string}>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ auth: Auth, fromAutoLogin: boolean }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());

export const register = createAction('[Auth] Register', props<{registration: Registration}>());
export const registerSuccess = createAction('[Auth] Register Success', props<{message: string}>());
export const registerFailure = createAction('[Auth] Register Failure', props<{error: string}>());

export const logout = createAction('[Auth] Logout');

export const init = createAction('[Auth] Init');