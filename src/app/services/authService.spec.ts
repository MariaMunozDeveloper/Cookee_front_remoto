import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './authService';
import { environment } from '../../environments/environment';
import {resolve} from 'chart.js/helpers';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/user`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  // --- getIdentity ---
  it('getIdentity debería devolver null si no hay nada en localStorage', () => {
    expect(service.getIdentity()).toBeNull();
  });

  it('getIdentity debería devolver el usuario guardado en localStorage', () => {
    const usuario = { _id: '123', nick: 'maria' };
    localStorage.setItem('user', JSON.stringify(usuario));
    expect(service.getIdentity()).toEqual(usuario);
  });

  // --- setIdentity ---
  it('setIdentity debería guardar el usuario en localStorage', () => {
    const usuario = { _id: '123', nick: 'maria' };
    service.setIdentity(usuario);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(usuario);
  });

  it('setIdentity debería emitir el usuario por identity$', () => {
    const usuario = { _id: '123', nick: 'maria' };
    return new Promise<void>((resolve) => {
      service.identity$.subscribe(value => {
        if (value) {
          expect(value).toEqual(usuario);
          resolve();
        }
      });
      service.setIdentity(usuario);
    });
  });

  // --- logout ---
  it('logout debería eliminar el usuario de localStorage', () => {
    localStorage.setItem('user', JSON.stringify({ _id: '123' }));
    service.logout();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('logout debería emitir null por identity$', () => {
    service.setIdentity({ _id: '123' });
    return new Promise<void>((resolve) => {
      service.identity$.subscribe(value => {
        if (value === null) {
          expect(value).toBeNull();
          resolve();
        }
      });
      service.logout();
    });
  });

  // --- login ---
  it('login debería hacer POST a la URL correcta', () => {
    const credenciales = { email: 'maria@test.com', password: '123456' };
    service.login(credenciales).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credenciales);
    req.flush({ user: { _id: '123' } });
  });

  // --- register ---
  it('register debería hacer POST a la URL correcta', () => {
    const usuario = { name: 'Maria', email: 'maria@test.com', password: '123456' } as any;
    service.register(usuario).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ user: usuario });
  });

  // --- refreshIdentity ---
  it('refreshIdentity no debería hacer petición si no hay identity', () => {
    service.refreshIdentity();
    httpMock.expectNone(`${apiUrl}/123`);
  });

  it('refreshIdentity debería actualizar la identity si el backend responde', () => {
    const usuario = { _id: '123', nick: 'maria' };
    service.setIdentity(usuario);
    const usuarioActualizado = { _id: '123', nick: 'maria_nueva' };
    service.refreshIdentity();
    const req = httpMock.expectOne(`${apiUrl}/123`);
    req.flush({ user: usuarioActualizado });
    expect(service.getIdentity()).toEqual(usuarioActualizado);
  });
});
