import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Profile } from './pages/profile/profile';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },

  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  { path: 'users', component: UsersComponent, canActivate: [authGuard] },

  { path: 'profile', component: Profile, canActivate: [authGuard] },
];
