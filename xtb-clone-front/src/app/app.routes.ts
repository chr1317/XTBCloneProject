import { Routes } from '@angular/router';
import { UsersComponent } from './pages/users/users';
import { Login } from './pages/login/login';
import { Dashboard } from './pages/dashboard/dashboard';
import { Profile } from './pages/profile/profile';
import { authGuard } from './guards/auth.guard';
import { Register } from './pages/register/register';
import { InstrumentsComponent } from './pages/instruments/instruments';
import { WalletComponent } from './pages/wallet/wallet';
import { PositionsComponent } from './pages/positions/positions';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },

  { path: 'register', component: Register },

  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  { path: 'users', component: UsersComponent, canActivate: [authGuard] },

  { path: 'profile', component: Profile, canActivate: [authGuard] },

  { path: 'instruments', component: InstrumentsComponent, canActivate: [authGuard] },

  { path: 'wallet', component: WalletComponent, canActivate: [authGuard] },

  { path: 'positions', component: PositionsComponent, canActivate: [authGuard] },
];
