import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Publication } from '../common/interfaces/publication';

@Injectable({
  providedIn: 'root'
})
export class PublicationService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/publication`;

  savePublication(publication: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save`, publication);
  }

  getFeed(page: number = 1): Observable<{ publications: Publication[], totalPages: number }> {
    return this.http.get<any>(`${this.apiUrl}/feed/${page}`).pipe(
      map(data => ({ publications: data.publications, totalPages: data.totalPages }))
    );
  }

  deletePublication(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/remove/${id}`);
  }

  getPublicationsByUser(userId: string, page: number = 1): Observable<Publication[]> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}/${page}`).pipe(
      map(data => data.publications)
    );
  }

  uploadImage(publicationId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file0', file);
    return this.http.post(`${this.apiUrl}/upload/${publicationId}`, formData);
  }

  uploadStepImage(publicationId: string, stepIndex: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file0', file);
    return this.http.post(`${this.apiUrl}/upload-step/${publicationId}/${stepIndex}`, formData);
  }

  getPublicationCounters(userId?: string): Observable<any> {
    if (userId) {
      return this.http.get(`${this.apiUrl}/count/${userId}`);
    }
    return this.http.get(`${this.apiUrl}/count`);
  }

  explore(page: number = 1, sort: string = 'recent', hashtag: string = '', search: string = ''): Observable<{
    publications: Publication[],
    totalPages: number
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/explore?page=${page}&sort=${sort}&hashtag=${hashtag}&search=${search}`
    ).pipe(
      map(data => ({ publications: data.publications, totalPages: data.totalPages }))
    );
  }

  getPublicationById(id: string): Observable<Publication> {
    return this.http.get<any>(`${this.apiUrl}/detail/${id}`).pipe(
      map(data => data.publication)
    );
  }

  updatePublication(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update/${id}`, data);
  }

  toggleLike(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/like/${id}`, {});
  }
}
