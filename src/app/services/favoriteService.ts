import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Publication } from '../common/interfaces/publication';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/favorite`;

  favoriteIds: WritableSignal<string[]> = signal<string[]>([]);

  loadMyFavorites(): void {
    this.http.get<any>(`${this.apiUrl}/check`).subscribe({
      next: (response) => {
        this.favoriteIds.set(response.favorites || []);
      },
      error: () => {
      }
    });
  }

  isFavorite(publicationId: string): boolean {
    return this.favoriteIds().includes(publicationId);
  }

  addFavorite(publicationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${publicationId}`, {});
  }

  removeFavorite(publicationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${publicationId}`);
  }

  toggleFavorite(publicationId: string): void {
    if (this.isFavorite(publicationId)) {
      this.removeFavorite(publicationId).subscribe({
        next: () => {
          this.favoriteIds.update(ids => ids.filter(id => id !== publicationId));
        },
        error: () => {
        }
      });
    } else {
      this.addFavorite(publicationId).subscribe({
        next: () => {
          this.favoriteIds.update(ids => [...ids, publicationId]);
        },
        error: () => {
        }
      });
    }
  }

  getMyFavorites(page: number = 1): Observable<{ publications: Publication[], totalPages: number }> {
    return this.http.get<any>(`${this.apiUrl}/my-favorites?page=${page}`);
  }
}
