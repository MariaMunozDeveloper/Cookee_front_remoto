import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { vi } from 'vitest';
import { adminGuard } from './admin-guard';

describe('adminGuard', () => {
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

  it('debería permitir el acceso si el usuario es admin', () => {
    localStorage.setItem('user', JSON.stringify({ _id: '123', role: 'ROLE_ADMIN' }));

    const resultado = TestBed.runInInjectionContext(() =>
      adminGuard(routeMock, stateMock)
    );

    expect(resultado).toBe(true);
  });

  it('debería redirigir a / si no hay usuario en localStorage', () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const resultado = TestBed.runInInjectionContext(() =>
      adminGuard(routeMock, stateMock)
    );

    expect(resultado).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/']);
  });

  it('debería redirigir a / si el usuario no es admin', () => {
    localStorage.setItem('user', JSON.stringify({ _id: '123', role: 'ROLE_USER' }));
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const resultado = TestBed.runInInjectionContext(() =>
      adminGuard(routeMock, stateMock)
    );

    expect(resultado).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/']);
  });

});
