import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import {MAT_MOMENT_DATE_FORMATS, MomentDateAdapter, provideMomentDateAdapter} from '@angular/material-moment-adapter';
import { routes } from './app.routes';
import { userReducer, UserEffects } from './sections/user/store';
import { TaskEffects, taskReducer } from './sections/task/store';
import { AuthEffects, authReducer } from './sections/auth/store';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import 'moment/locale/de-ch';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { RoleEffects, roleReducer } from './sections/role/store';
import { EventEffects, eventReducer } from './sections/event/store';
import { LeaderboardEffects, leaderboardReducer } from './sections/leaderboard/store';
import { GamificationEffects, gamificationReducer } from './sections/gamification-management/store';
moment.locale('de-ch');
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de-ch' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 2500}},
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideStore({
      user: userReducer, 
      task: taskReducer, 
      auth: authReducer, 
      role: roleReducer, 
      event: eventReducer, 
      leaderboard: leaderboardReducer, 
      gamification: gamificationReducer
    }),
    provideEffects([
      UserEffects, 
      TaskEffects, 
      AuthEffects, 
      RoleEffects, 
      EventEffects, 
      LeaderboardEffects, 
      GamificationEffects]),
    provideStoreDevtools({ maxAge: 25 }),
    provideRouter(routes),
  ]
};
