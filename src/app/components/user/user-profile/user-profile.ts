import { inject, Component, signal, WritableSignal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from '../../../services/userService';
import { FollowService } from '../../../services/followService';
import { PublicationService } from '../../../services/publicationService';
import { AuthService } from '../../../services/authService';
import { FavoriteService } from '../../../services/favoriteService';
import { Publication } from '../../../common/interfaces/publication';
import { LoadingSpinner } from '../../shared/loading-spinner/loading-spinner';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal';
import { AsAnyPipe } from '../../../pipes/as-any.pipe';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [RouterLink, LoadingSpinner, ConfirmModalComponent, AsAnyPipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfileComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly userService: UserService = inject(UserService);
  private readonly followService: FollowService = inject(FollowService);
  private readonly publicationService: PublicationService = inject(PublicationService);
  private readonly authService: AuthService = inject(AuthService);
  readonly favoriteService: FavoriteService = inject(FavoriteService);

  publicationToDelete: string = '';
  identity: any = this.authService.getIdentity();

  profileUser: any = null;
  counters: any = null;
  publicationsCount: number = 0;

  isFollowing: boolean = false;
  isOwnProfile: boolean = false;

  activeTab: 'recipes' | 'favorites' = 'recipes';

  publications: WritableSignal<Publication[]> = signal<Publication[]>([]);
  favorites: WritableSignal<Publication[]> = signal<Publication[]>([]);
  loadingFavorites: WritableSignal<boolean> = signal<boolean>(false);

  showDeleteModal: WritableSignal<boolean> = signal<boolean>(false);
  loading: WritableSignal<boolean> = signal<boolean>(true);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.activeTab = 'recipes';
      this.loadProfile(params['id']);
    });
  }

  loadProfile(userId: string): void {
    this.loading.set(true);

    this.userService.getUserById(userId).subscribe({
      next: (response: any) => {
        this.profileUser = response.user;
        this.isOwnProfile = this.identity?._id === userId;
        this.isFollowing = response.following === true;

        this.userService.getCounters(userId).subscribe({
          next: (countersRes: any) => {
            this.counters = countersRes;
          }
        });

        this.publicationService.getPublicationCounters(userId).subscribe({
          next: (res: any) => {
            this.publicationsCount = res.total ?? 0;
          }
        });

        this.publicationService.getPublicationsByUser(userId).subscribe({
          next: (publications: Publication[]) => {
            this.publications.set(publications);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  setTab(tab: 'recipes' | 'favorites'): void {
    this.activeTab = tab;
    if (tab === 'favorites' && this.favorites().length === 0) {
      this.loadFavorites();
    }
  }

  loadFavorites(): void {
    this.loadingFavorites.set(true);
    this.favoriteService.getMyFavorites().subscribe({
      next: (response: any) => {
        this.favorites.set(response.publications || []);
        this.loadingFavorites.set(false);
      },
      error: () => {
        this.loadingFavorites.set(false);
      }
    });
  }

  removeFavorite(publicationId: string, event: Event): void {
    event.stopPropagation();
    this.favoriteService.removeFavorite(publicationId).subscribe({
      next: () => {
        this.favorites.update(current => current.filter(p => p._id !== publicationId));
        this.favoriteService.favoriteIds.update(ids => ids.filter(id => id !== publicationId));
      },
      error: () => {
      }
    });
  }

  follow(): void {
    this.followService.followUser(this.profileUser._id).subscribe({
      next: () => {
        this.isFollowing = true;
      }
    });
  }

  unfollow(): void {
    this.followService.unfollowUser(this.profileUser._id).subscribe({
      next: () => {
        this.isFollowing = false;
      }
    });
  }

  confirmDelete(id: string): void {
    this.publicationToDelete = id;
    this.showDeleteModal.set(true);
  }

  deletePublication(): void {
    this.showDeleteModal.set(false);
    this.publicationService.deletePublication(this.publicationToDelete).subscribe({
      next: () => {
        this.publications.update(current =>
          current.filter(p => p._id !== this.publicationToDelete)
        );
      },
      error: () => {
      }
    });
  }

  getCover(publication: Publication): string | null {
    return publication.images && publication.images.length > 0
      ? publication.images[0]
      : null;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    return num.toString();
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
                : (p.likes || []).filter((l: any) => l !== this.identity._id)
            }
            : p
          )
        );
        this.favorites.update(current =>
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
}
