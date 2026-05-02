import {inject, Component, signal, WritableSignal, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {PublicationService} from '../../services/publicationService';
import {AuthService} from '../../services/authService';
import {UserService} from '../../services/userService';
import {Publication} from '../../common/interfaces/publication';
import {AsAnyPipe} from '../../pipes/as-any.pipe';

interface HashtagSection {
  tag: string;
  icon: string;
  recipes: Publication[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AsAnyPipe],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  private readonly publicationService: PublicationService = inject(PublicationService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly userService: UserService = inject(UserService);
  private readonly router: Router = inject(Router);

  trendingRecipes: WritableSignal<Publication[]> = signal<Publication[]>([]);
  heroImages: WritableSignal<string[]> = signal<string[]>([]);
  heroUsers: WritableSignal<any[]> = signal<any[]>([]);
  hashtagSections: WritableSignal<HashtagSection[]> = signal<HashtagSection[]>([]);
  loaded: WritableSignal<boolean> = signal<boolean>(false);

  isLoggedIn: boolean = !!this.authService.getToken();
  identity: any = this.authService.getIdentity();

  private readonly featuredHashtags: { tag: string; icon: string }[] = [
    {tag: 'tradicional', icon: 'icons/miton_one_color.svg'},
    {tag: 'saludable', icon: 'icons/verduras.svg'},
    {tag: 'postre', icon: 'icons/pastel.svg'},
  ];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.publicationService.explore(1, 'likes', '').subscribe({
      next: (response) => {
        const recipes = response.publications.slice(0, 6);
        this.trendingRecipes.set(recipes);

        const images = recipes
          .map(r => this.getCover(r))
          .filter((img): img is string => img !== null)
          .slice(0, 6);
        this.heroImages.set(images);

        this.loaded.set(true);
      },
      error: () => {
        this.loaded.set(true);
      }
    });

    this.userService.getUsers(1, 50).subscribe({
      next: (response: any) => {
        const users = (response.users || []).filter((u: any) => u.image);
        this.heroUsers.set(this.getRotatingUsers(users));
      },
      error: () => {
      }
    });

    this.featuredHashtags.forEach(({tag, icon}) => {
      this.publicationService.explore(1, 'likes', tag).subscribe({
        next: (response) => {
          const recipes = response.publications.slice(0, 5);
          if (recipes.length > 0) {
            this.hashtagSections.update(current => [
              ...current,
              {tag, icon, recipes}
            ]);
          }
        },
        error: () => {
        }
      });
    });
  }

  private getRotatingUsers(users: any[]): any[] {
    const stored = localStorage.getItem('heroUsers');
    const storedDate = localStorage.getItem('heroUsersDate');
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    if (stored && storedDate && now.getTime() - new Date(storedDate).getTime() < threeDays) {
      const storedUsers = JSON.parse(stored);
      const stillValid = storedUsers.every((su: any) =>
        users.some((u: any) => u._id === su._id)
      );
      if (stillValid && storedUsers.length >= 4) return storedUsers;
    }

    const shuffled = [...users].sort(() => Math.random() - 0.5).slice(0, 4);
    localStorage.setItem('heroUsers', JSON.stringify(shuffled));
    localStorage.setItem('heroUsersDate', now.toISOString());
    return shuffled;
  }

  get heroCircles(): { type: 'recipe' | 'user', src: string }[] {
    const recipes = this.heroImages().map(src => ({type: 'recipe' as const, src}));
    const users = this.heroUsers()
      .filter(u => u?.image)
      .map(u => ({type: 'user' as const, src: u.image}));

    const result: { type: 'recipe' | 'user', src: string }[] = [];
    let ri = 0, ui = 0;
    while (ri < recipes.length || ui < users.length) {
      if (ri < recipes.length) result.push(recipes[ri++]);
      if (ri < recipes.length) result.push(recipes[ri++]);
      if (ui < users.length) result.push(users[ui++]);
    }
    return result;
  }

  getHeroUser(index: number): any {
    return this.heroUsers()[index] ?? null;
  }

  toggleLike(id: string, event: Event): void {
    event.stopPropagation();

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

    this.publicationService.toggleLike(id).subscribe({
      next: (response: any) => {
        this.trendingRecipes.update(current =>
          current.map(p => p._id === id
            ? {
              ...p, likes: response.hasLike
                ? [...(p.likes || []), this.identity._id]
                : (p.likes || []).filter((l: string) => l !== this.identity._id)
            }
            : p
          )
        );

        this.hashtagSections.update(sections =>
          sections.map(section => ({
            ...section,
            recipes: section.recipes.map(p => p._id === id
              ? {
                ...p, likes: response.hasLike
                  ? [...(p.likes || []), this.identity._id]
                  : (p.likes || []).filter((l: string) => l !== this.identity._id)
              }
              : p
            )
          }))
        );
      },
      error: () => {
      }
    });
  }

  isLiked(publication: Publication): boolean {
    return (publication.likes || []).some((l: any) => l.toString() === this.identity?._id);
  }

  getCover(publication: Publication): string | null {
    return publication.images && publication.images.length > 0
      ? publication.images[0]
      : null;
  }

  getCommentsCount(publication: Publication): number {
    return (publication as any).commentsCount ?? 0;
  }

  getHeroImage(index: number): string | null {
    return this.heroImages()[index] ?? null;
  }
}
