import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/authService';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const identity = authService.getIdentity();

  if (identity && identity.role === 'ROLE_ADMIN') {
    return true;
  }

  router.navigate(['/']);
  return false;
};
