import { provideStore } from '@ngrx/store';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { authReducer } from './sections/auth/store';
import { userReducer } from './sections/user/store';
import { taskReducer } from './sections/task/store';
import { eventReducer } from './sections/event/store';
import { roleReducer } from './sections/role/store';
import { leaderboardReducer } from './sections/leaderboard/store';
import { gamificationReducer } from './sections/gamification-management/store';

export function provideTestStore() {
  return provideStore({
    user: userReducer,
    task: taskReducer,
    auth: authReducer,
    role: roleReducer,
    event: eventReducer,
    leaderboard: leaderboardReducer,
    gamification: gamificationReducer
  });
}

export function provideTestDateAdapter() {
  return [
    provideMomentDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'de-ch' }
  ];
}

