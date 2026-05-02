import {inject, Component, signal, WritableSignal, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {FollowService} from '../../../services/followService';
import {LoadingSpinner} from '../../shared/loading-spinner/loading-spinner';
import {AuthService} from '../../../services/authService';


@Component({
  selector: 'app-follows',
  standalone: true,
  imports: [RouterLink, LoadingSpinner],
  templateUrl: './follows.html',
  styleUrl: './follows.css'
})
export class FollowsComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly followService: FollowService = inject(FollowService);
  private readonly authService: AuthService = inject(AuthService);
  identity: any = this.authService.getIdentity();

  modo: 'following' | 'followers' = 'following';
  userId: string = '';

  users: WritableSignal<any[]> = signal<any[]>([]);
  loading: WritableSignal<boolean> = signal<boolean>(false);
  page: number = 1;
  totalPages: number = 1;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['id'] || '';
      this.modo = params['modo'] === 'followers' ? 'followers' : 'following';
      this.page = 1;
      this.users.set([]);
      this.loadUsers();
    });
  }

  loadUsers(): void {
    this.loading.set(true);

    const request = this.modo === 'following'
      ? this.followService.getFollowing(this.userId || undefined, this.page)
      : this.followService.getFollowers(this.userId || undefined, this.page);

    request.subscribe({
      next: (response: any) => {
        this.users.set(response.follows.map((f: any) =>
          this.modo === 'following' ? f.followed : f.user
        ));
        this.totalPages = response.pages;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadUsers();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }

  get titulo(): string {
    return this.modo === 'following' ? 'Siguiendo' : 'Seguidores';
  }

  unfollow(userId: string): void {
    this.followService.unfollowUser(userId).subscribe({
      next: () => {
        this.users.update(current => current.filter(u => u._id !== userId));
      },
      error: () => {
      }
    });
  }

  get isOwnProfile(): boolean {
    return !this.userId || this.userId === this.identity?._id;
  }
}
