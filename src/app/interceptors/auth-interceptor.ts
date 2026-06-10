import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/authService';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authReq = req.clone({
    withCredentials: true
  });

  return next(authReq).pipe(
    catchError((error) => {
      const isAuthPage = req.url.includes('/login') || req.url.includes('/register');

      if (error.status === 401 && !isAuthPage && authService.getIdentity()) {
        authService.logout();
        router.navigate(['/login'], { queryParams: { expired: true } });
      }

      return throwError(() => error);
    })
  );
};
