import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../common/interfaces/user';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  private readonly identitySubject = new BehaviorSubject<any>(this.getIdentity());
  readonly identity$ = this.identitySubject.asObservable();

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(user: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, user);
  }

  getIdentity(): any {
    const user = localStorage.getItem('user');
    if (user && user !== 'undefined') {
      return JSON.parse(user);
    }
    return null;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (token && token !== 'undefined') {
      return token;
    }
    return null;
  }

  setIdentity(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.identitySubject.next(user);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.identitySubject.next(null);
  }
}
