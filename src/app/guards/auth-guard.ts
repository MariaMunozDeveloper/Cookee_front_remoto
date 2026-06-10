import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/authService';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const identity = authService.getIdentity();

  if (identity) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
