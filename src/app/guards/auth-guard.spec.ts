import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth-guard';
import { vi } from 'vitest';

describe('authGuard', () => {
  let router: Router;
  const routeMock = {} as ActivatedRouteSnapshot;
  const stateMock = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    router = TestBed.inject(Router);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debería permitir el acceso si hay usuario en localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ _id: '123', nick: 'maria' }));

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard(routeMock, stateMock)
    );

    expect(resultado).toBe(true);
  });

  it('debería redirigir a /login si no hay usuario en localStorage', () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const resultado = TestBed.runInInjectionContext(() =>
      authGuard(routeMock, stateMock)
    );

    expect(resultado).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/login']);
  });

});
