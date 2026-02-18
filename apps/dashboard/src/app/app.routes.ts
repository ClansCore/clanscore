import { Routes } from '@angular/router';
import { UserPageComponent } from './sections/user/pages/user-page/user-page.component';
import { TaskPageComponent } from './sections/task/pages/task-page/task-page.component';
import { LoginPageComponent } from './sections/auth/pages/login-page/login-page.component';
import { authGuard } from './core/guards/auth.guard';
import { loggedOutGuard } from './core/guards/logged-out.guard';
import { adminGuard } from './core/guards/admin.guard';
import { ApplicationFormComponent } from './sections/auth/components/application-form/application-form.component';
import { ApplicationPageComponent } from './sections/auth/pages/application-page/application-page.component';
import { RolePageComponent } from './sections/role/pages/role-page/role-page.component';
import { EventPageComponent } from './sections/event/pages/event-page/event-page.component';
import { LeaderboardPageComponent } from './sections/leaderboard/pages/leaderboard-page/leaderboard-page.component';
import { GamificationManagementPageComponent } from './sections/gamification-management/pages/gamification-management-page/gamification-management-page.component';
import { AdminPageComponent } from './sections/admin/pages/admin-page/admin-page.component';

export const routes: Routes = [
    {
        path: 'login',
        canActivate: [loggedOutGuard],
        component: LoginPageComponent,
        pathMatch: 'full'
    },
    /*
    {
        path: 'application',
        canActivate: [loggedOutGuard],
        component: ApplicationPageComponent,
        pathMatch: 'full'
    },*/
    {
        path: 'user',
        canActivate: [authGuard],
        component: UserPageComponent,
        pathMatch: 'full'
    },
    {
        path: 'task',
        canActivate: [authGuard],
        component: TaskPageComponent,
        pathMatch: 'full'
    },
    {
        path: 'role',
        canActivate: [authGuard],
        component: RolePageComponent,
        pathMatch: 'full'
    },
    {
        path: 'event',
        canActivate: [authGuard],
        component: EventPageComponent,
        pathMatch: 'full'
    },
    {
        path: 'leaderboard',
        canActivate: [authGuard],
        component: LeaderboardPageComponent,
        pathMatch: 'full'
    },
    {
        path: 'gamification',
        canActivate: [authGuard],
        component: GamificationManagementPageComponent,
        pathMatch: 'full'
    },
    {
        path: 'admin',
        canActivate: [adminGuard],
        component: AdminPageComponent,
        pathMatch: 'full'
    },
    { 
        path: '**', 
        redirectTo: 'login'
    }
];
