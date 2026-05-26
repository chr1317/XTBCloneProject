import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  const token = localStorage.getItem('token');

  if (token && auth.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};