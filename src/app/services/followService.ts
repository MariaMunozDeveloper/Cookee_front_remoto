import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FollowService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/follow`;

  followUser(followedId: string): Observable<any> {
    return this.http.post(this.apiUrl, { followed: followedId });
  }

  unfollowUser(followedId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${followedId}`);
  }

  getFollowing(userId?: string, page: number = 1): Observable<any> {
    const url = userId
      ? `${this.apiUrl}/following/${userId}?page=${page}`
      : `${this.apiUrl}/following?page=${page}`;
    return this.http.get(url);
  }

  getFollowers(userId?: string, page: number = 1): Observable<any> {
    const url = userId
      ? `${this.apiUrl}/followers/${userId}?page=${page}`
      : `${this.apiUrl}/followers?page=${page}`;
    return this.http.get(url);
  }
}
