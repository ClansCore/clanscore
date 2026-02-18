import { createAction, props } from '@ngrx/store';
import { User } from '../../../core/models/domain/user.model';

export const getAllUsers = createAction('[User] GetAllUsers');
export const getAllUsersSuccess = createAction('[User] GetAllUsers Success', props<{ users: User[] }>());
export const getAllUsersFailure = createAction('[User] GetAllUsers Failure', props<{ error: string }>());

export const addUser = createAction('[User] AddUser', props<{ user: User }>());
export const addUserSuccess = createAction('[User] AddUser Success', props<{ user: User }>());
export const addUserFailure = createAction('[User] AddUser Failure', props<{ error: string }>());

export const updateUser = createAction('[User] UpdateUser', props<{ user: User }>());
export const updateUserSuccess = createAction('[User] UpdateUser Success', props<{ user: User }>());
export const updateUserFailure = createAction('[User] UpdateUser Failure', props<{ error: string }>());

export const deleteUser = createAction('[User] DeleteUser', props<{ user: User }>());
export const deleteUserSuccess = createAction('[User] DeleteUser Success', props<{ user: User }>());
export const deleteUserFailure = createAction('[User] DeleteUser Failure', props<{ error: string }>());

export const setUserPassword = createAction('[User] SetUserPassword', props<{ userId: string; password: string }>());
export const setUserPasswordSuccess = createAction('[User] SetUserPassword Success', props<{ userId: string; message: string }>());
export const setUserPasswordFailure = createAction('[User] SetUserPassword Failure', props<{ error: string }>());

export const changeOwnPassword = createAction('[User] ChangeOwnPassword', props<{ password: string; currentPassword: string }>());
export const changeOwnPasswordSuccess = createAction('[User] ChangeOwnPassword Success', props<{ message: string }>());
export const changeOwnPasswordFailure = createAction('[User] ChangeOwnPassword Failure', props<{ error: string }>());