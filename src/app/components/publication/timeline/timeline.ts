import {inject, Component, OnInit, signal, WritableSignal, HostListener} from '@angular/core';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../../services/authService';
import {PublicationService} from '../../../services/publicationService';
import {UserCardComponent} from '../../shared/user-card/user-card';
import {Publication} from '../../../common/interfaces/publication';
import {LoadingSpinner} from '../../shared/loading-spinner/loading-spinner';
import {ConfirmModalComponent} from '../../shared/confirm-modal/confirm-modal';
import {FavoriteService} from '../../../services/favoriteService';
import {UserService} from '../../../services/userService';
import {AsAnyPipe} from '../../../pipes/as-any.pipe';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [UserCardComponent, RouterLink, LoadingSpinner, ConfirmModalComponent, AsAnyPipe],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css'
})
export class TimelineComponent implements OnInit {
  private readonly authService: AuthService = inject(AuthService);
  private readonly publicationService: PublicationService = inject(PublicationService);
  readonly favoriteService: FavoriteService = inject(FavoriteService);
  private readonly userService: UserService = inject(UserService);

  identity: any = this.authService.getIdentity();
  stats: WritableSignal<any> = signal<any>(JSON.parse(localStorage.getItem('stats') || 'null'));

  publications: WritableSignal<Publication[]> = signal<Publication[]>([]);
  loading: WritableSignal<boolean> = signal<boolean>(false);

  page: number = 1;
  totalPages: number = 1;
  hasMore: boolean = true;

  activeMenu: WritableSignal<string | null> = signal<string | null>(null);
  showDeleteModal: WritableSignal<boolean> = signal<boolean>(false);
  publicationToDelete: string = '';

  ngOnInit(): void {
    this.getPublications();
    this.loadStats();
  }

  loadStats(): void {
    this.userService.getCounters().subscribe({
      next: (response: any) => {
        this.stats.set(response);
        localStorage.setItem('stats', JSON.stringify(response));
      },
      error: () => {
      }
    });
  }

  getPublications(reset: boolean = false): void {
    if (this.loading() || (!this.hasMore && !reset)) return;

    if (reset) {
      this.page = 1;
      this.publications.set([]);
      this.hasMore = true;
    }

    this.loading.set(true);

    this.publicationService.getFeed(this.page).subscribe({
      next: (response) => {
        this.publications.update(current => [...current, ...response.publications]);
        this.totalPages = response.totalPages;
        this.page++;
        this.hasMore = this.page <= response.totalPages;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  isMyPublication(publication: Publication): boolean {
    const author = publication.user as any;
    return author?._id === this.identity?._id || author === this.identity?._id;
  }

  getAuthor(publication: Publication): any {
    return publication.user as any;
  }

  getCover(publication: Publication): string | null {
    return publication.images && publication.images.length > 0
      ? publication.images[0]
      : null;
  }

  getTimeAgo(date: string | undefined): string {
    if (!date) return '';
    const now = new Date();
    const created = new Date(date);
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `hace ${Math.floor(diff / 86400)} días`;
    return created.toLocaleDateString('es-ES', {day: 'numeric', month: 'long'});
  }

  toggleLike(id: string, event: Event): void {
    event.stopPropagation();
    this.publicationService.toggleLike(id).subscribe({
      next: (response: any) => {
        this.publications.update(current =>
          current.map(p => p._id === id
            ? {
              ...p, likes: response.hasLike
                ? [...(p.likes || []), this.identity._id]
                : (p.likes || []).filter((l: string) => l !== this.identity._id)
            }
            : p
          )
        );
      },
      error: () => {
      }
    });
  }

  isLiked(publication: Publication): boolean {
    return (publication.likes || []).some((l: any) => l.toString() === this.identity?._id);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (!this.hasMore || this.loading()) return;

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= docHeight - 500) {
      this.getPublications();
    }
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.activeMenu.set(this.activeMenu() === id ? null : id);
  }

  @HostListener('document:click')
  closeMenu(): void {
    this.activeMenu.set(null);
  }

  confirmDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.publicationToDelete = id;
    this.activeMenu.set(null);
    this.showDeleteModal.set(true);
  }

  deletePublication(): void {
    this.showDeleteModal.set(false);
    this.publicationService.deletePublication(this.publicationToDelete).subscribe({
      next: (response: any) => {
        if (response.status) {
          this.publications.update(current =>
            current.filter(p => p._id !== this.publicationToDelete)
          );
        }
      },
      error: () => {
      }
    });
  }
}
