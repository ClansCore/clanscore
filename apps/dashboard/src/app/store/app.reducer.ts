import { ActionReducerMap } from '@ngrx/store';
import * as fromUser from '../sections/user/store';


export interface AppState {
  user: fromUser.UserState;
}

export const appReducer: ActionReducerMap<AppState> = {
  user: fromUser.userReducer,
};