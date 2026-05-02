import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/user`;

  getCounters(userId?: string): Observable<any> {
    if (userId) {
      return this.http.get(`${this.apiUrl}/counters/${userId}`);
    }
    return this.http.get(`${this.apiUrl}/counters`);
  }

  updateUser(userData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, userData);
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post(`${this.apiUrl}/upload-avatar`, formData);
  }

  getUsers(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=${page}&limit=${limit}&search=${search}`);
  }

  getUserById(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user/${userId}`);
  }
}
