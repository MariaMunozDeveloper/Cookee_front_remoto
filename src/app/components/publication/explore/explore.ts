import {inject, Component, signal, WritableSignal, OnInit, HostListener} from '@angular/core';
import {RouterLink, ActivatedRoute, Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {PublicationService} from '../../../services/publicationService';
import {Publication} from '../../../common/interfaces/publication';
import {LoadingSpinner} from '../../shared/loading-spinner/loading-spinner';
import {UpperCasePipe} from '@angular/common';
import {FavoriteService} from '../../../services/favoriteService';
import {AuthService} from '../../../services/authService';
import {AsAnyPipe} from '../../../pipes/as-any.pipe';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingSpinner, UpperCasePipe, AsAnyPipe],
  templateUrl: './explore.html',
  styleUrl: './explore.css'
})
export class ExploreComponent implements OnInit {
  private readonly publicationService: PublicationService = inject(PublicationService);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly router: Router = inject(Router);
  private readonly authService: AuthService = inject(AuthService);
  readonly favoriteService: FavoriteService = inject(FavoriteService);

  publications: WritableSignal<Publication[]> = signal<Publication[]>([]);
  loading: WritableSignal<boolean> = signal<boolean>(false);

  page: number = 1;
  totalPages: number = 1;
  hasMore: boolean = true;
  isLoggedIn: boolean = !!this.authService.getToken();
  identity: any = this.authService.getIdentity();

  sortBy: string = 'recent';
  searchHashtag: string = '';
  hashtagInput: string = '';
  search: string = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['hashtag']) {
        this.searchHashtag = params['hashtag'];
        this.hashtagInput = params['hashtag'];
      }
      this.loadRecetas(true);
    });
  }

  loadRecetas(reset: boolean = false): void {
    if (this.loading() || (!this.hasMore && !reset)) return;
    if (reset) {
      this.page = 1;
      this.publications.set([]);
      this.hasMore = true;
    }
    this.loading.set(true);
    this.publicationService.explore(this.page, this.sortBy, this.searchHashtag, this.search).subscribe({
      next: (response) => {
        this.publications.update(current => [...current, ...response.publications]);
        this.totalPages = response.totalPages;
        this.hasMore = this.page < response.totalPages;
        this.page++;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setSort(sort: string): void {
    this.sortBy = sort;
    this.loadRecetas(true);
  }

  buscarHashtag(): void {
    const input = this.hashtagInput.trim().toLowerCase();
    if (input.startsWith('#')) {
      this.searchHashtag = input.slice(1);
      this.search = '';
    } else {
      this.search = input;
      this.searchHashtag = '';
    }
    this.router.navigate([], {
      queryParams: this.searchHashtag ? {hashtag: this.searchHashtag} : {},
      queryParamsHandling: 'replace'
    });
    this.loadRecetas(true);
  }

  clearHashtag(): void {
    this.searchHashtag = '';
    this.hashtagInput = '';
    this.search = '';
    this.router.navigate([], {queryParams: {}});
    this.loadRecetas(true);
  }

  getCover(publication: Publication): string | null {
    return publication.images?.length > 0 ? publication.images[0] : null;
  }

  getAuthor(publication: Publication): any {
    return publication.user as any;
  }

  toggleLike(id: string, event: Event): void {
    event.stopPropagation();
    if (!this.isLoggedIn) return;

    this.publicationService.toggleLike(id).subscribe({
      next: (response: any) => {
        this.publications.update(current =>
          current.map(p => p._id === id
            ? {
              ...p, likes: response.hasLike
                ? [...(p.likes || []), this.identity._id]
                : (p.likes || []).filter((l: any) => l !== this.identity._id)
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
      this.loadRecetas();
    }
  }
}
