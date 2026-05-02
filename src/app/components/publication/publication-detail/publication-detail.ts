import {inject, Component, signal, WritableSignal, OnInit} from '@angular/core';
import {ActivatedRoute, RouterLink, Router} from '@angular/router';
import {PublicationService} from '../../../services/publicationService';
import {AuthService} from '../../../services/authService';
import {Publication} from '../../../common/interfaces/publication';
import {LoadingSpinner} from '../../shared/loading-spinner/loading-spinner';
import {AsAnyPipe} from '../../../pipes/as-any.pipe';
import {CommentService} from '../../../services/commentService';
import {FormsModule} from '@angular/forms';
import {ConfirmModalComponent} from '../../shared/confirm-modal/confirm-modal';
import {FavoriteService} from '../../../services/favoriteService';
import {FORBIDDEN_WORDS} from '../../../validators/forbidden-words';

@Component({
  selector: 'app-publication-detail',
  standalone: true,
  imports: [RouterLink, LoadingSpinner, AsAnyPipe, FormsModule, ConfirmModalComponent],
  templateUrl: './publication-detail.html',
  styleUrl: './publication-detail.css'
})
export class PublicationDetailComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly publicationService: PublicationService = inject(PublicationService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly commentService: CommentService = inject(CommentService);
  private readonly router: Router = inject(Router);
  readonly favoriteService: FavoriteService = inject(FavoriteService);

  identity: any = this.authService.getIdentity();
  isLoggedIn: boolean = !!this.authService.getToken();

  publication: WritableSignal<Publication | null> = signal<Publication | null>(null);
  commentToDeleteParent: string | undefined = undefined;
  loading: WritableSignal<boolean> = signal<boolean>(true);

  hasLike: WritableSignal<boolean> = signal<boolean>(false);
  likesCount: WritableSignal<number> = signal<number>(0);

  comments: WritableSignal<any[]> = signal<any[]>([]);
  commentText: string = '';
  sendingComment: boolean = false;
  commentError: string = '';

  replyingTo: string | null = null;
  replyText: string = '';
  sendingReply: boolean = false;
  replyError: string = '';
  commentToDelete: string = '';
  hasReplies: boolean = false;

  introError: string = '';
  recommendationsError: string = '';

  showDeleteModal: WritableSignal<boolean> = signal<boolean>(false);
  showDeleteCommentModal: WritableSignal<boolean> = signal<boolean>(false);

  recommendations: WritableSignal<string[]> = signal<string[]>([]);
  editingRecommendations: WritableSignal<boolean> = signal<boolean>(false);
  savingRecommendations: boolean = false;
  dragIndex: number | null = null;

  introText: WritableSignal<string> = signal<string>('');
  editingIntro: WritableSignal<boolean> = signal<boolean>(false);
  savingIntro: boolean = false;
  introInput: string = '';

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.loadPublication(params['id']);
    });

    this.route.fragment.subscribe(fragment => {
      if (fragment === 'comentarios') {
        setTimeout(() => {
          const el = document.getElementById('comentarios');
          if (el) el.scrollIntoView({behavior: 'smooth'});
        }, 800);
      }
    });
  }

  private loadPublication(id: string): void {
    this.loading.set(true);

    this.publicationService.getPublicationById(id).subscribe({
      next: (publication: Publication) => {
        this.publication.set(publication);
        this.likesCount.set((publication as any).likes?.length ?? 0);

        const likes = (publication as any).likes || [];
        this.hasLike.set(likes.some((l: any) => l.toString() === this.identity?._id));

        const raw = (publication as any).recommendations || '';
        this.introText.set((publication as any).text || '');
        this.recommendations.set(
          raw ? raw.split('\n').filter((r: string) => r.trim()) : []
        );

        this.loading.set(false);
        if (this.isLoggedIn) {
          this.loadComments(id);
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  toggleLike(): void {
    const pub = this.publication();
    if (!pub) return;

    this.publicationService.toggleLike(pub._id).subscribe({
      next: (response: any) => {
        this.likesCount.set(response.likes);
        this.hasLike.set(response.hasLike);
      },
      error: () => {
      }
    });
  }

  isMyPublication(): boolean {
    const pub = this.publication();
    if (!pub) return false;
    const author = pub.user as any;
    return author?._id === this.identity?._id || author === this.identity?._id;
  }

  isPublicationAuthor(userId: string): boolean {
    const pub = this.publication();
    if (!pub) return false;
    const author = pub.user as any;
    return author?._id === userId || author === userId;
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

  private loadComments(publicationId: string): void {
    this.commentService.getByPublication(publicationId).subscribe({
      next: (comments: any[]) => this.comments.set(comments),
      error: () => {
      }
    });
  }

  saveComment(): void {
    if (!this.commentText.trim()) return;

    const found = FORBIDDEN_WORDS.find(word =>
      new RegExp(`\\b${word.toLowerCase()}\\b`, 'i').test(this.commentText.toLowerCase())
    );

    if (found) {
      this.commentError = `La palabra "${found}" infringe las normas de la comunidad`;
      return;
    }

    this.commentError = '';
    this.sendingComment = true;

    this.commentService.save(this.publication()!._id, this.commentText.trim()).subscribe({
      next: (response: any) => {
        this.comments.update(current => [{...response.comment, replies: []}, ...current]);
        this.commentText = '';
        this.sendingComment = false;
      },
      error: () => {
        this.sendingComment = false;
      }
    });
  }

  startReply(commentId: string, nick?: string): void {
    this.replyingTo = commentId;
    this.replyText = nick ? `@${nick} ` : '';
    this.replyError = '';
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyText = '';
    this.replyError = '';
  }

  saveReply(commentId: string): void {
    if (!this.replyText.trim()) return;

    const found = FORBIDDEN_WORDS.find(word =>
      new RegExp(`\\b${word.toLowerCase()}\\b`, 'i').test(this.replyText.toLowerCase())
    );

    if (found) {
      this.replyError = `La palabra "${found}" infringe las normas de la comunidad`;
      return;
    }

    this.replyError = '';
    this.sendingReply = true;

    this.commentService.reply(commentId, this.replyText.trim()).subscribe({
      next: (response: any) => {
        this.comments.update(current =>
          current.map(c => c._id === commentId
            ? {...c, replies: [...(c.replies || []), response.comment]}
            : c
          )
        );
        this.replyingTo = null;
        this.replyText = '';
        this.sendingReply = false;
      },
      error: () => {
        this.sendingReply = false;
      }
    });
  }

  confirmDeleteComment(commentId: string, parentId?: string, replies?: any[]): void {
    this.commentToDelete = commentId;
    this.commentToDeleteParent = parentId;
    this.hasReplies = !parentId && (replies?.length ?? 0) > 0;
    this.showDeleteCommentModal.set(true);
  }

  deleteComment(): void {
    this.showDeleteCommentModal.set(false);
    this.commentService.remove(this.commentToDelete).subscribe({
      next: () => {
        if (this.commentToDeleteParent) {
          this.comments.update(current =>
            current.map(c => c._id === this.commentToDeleteParent
              ? {...c, replies: c.replies.filter((r: any) => r._id !== this.commentToDelete)}
              : c
            )
          );
        } else {
          this.comments.update(current => current.filter(c => c._id !== this.commentToDelete));
        }
      },
      error: () => {
      }
    });
  }

  canDelete(comment: any): boolean {
    return comment.user?._id === this.identity?._id || this.isMyPublication();
  }

  isMyComment(comment: any): boolean {
    return comment.user?._id === this.identity?._id;
  }

  confirmDelete(): void {
    this.showDeleteModal.set(true);
  }

  deletePublication(): void {
    this.showDeleteModal.set(false);
    this.publicationService.deletePublication(this.publication()!._id).subscribe({
      next: () => {
        this.router.navigate(['/feed']);
      },
      error: () => {
      }
    });
  }

  startEditingRecommendations(): void {
    this.editingRecommendations.set(true);
  }

  cancelEditingRecommendations(): void {
    const raw = (this.publication() as any)?.recommendations || '';
    this.recommendations.set(
      raw ? raw.split('\n').filter((r: string) => r.trim()) : []
    );
    this.editingRecommendations.set(false);
  }

  addRecommendation(): void {
    this.recommendations.update(current => [...current, '']);
  }

  updateRecommendation(index: number, value: string): void {
    this.recommendations.update(current => {
      const updated = [...current];
      updated[index] = value;
      return updated;
    });
  }

  removeRecommendation(index: number): void {
    this.recommendations.update(current => current.filter((_, i) => i !== index));
  }

  saveRecommendations(): void {
    const clean = this.recommendations().filter(r => r.trim());

    const found = clean.find(rec => {
      const lower = rec.toLowerCase();
      return FORBIDDEN_WORDS.find(word =>
        new RegExp(`\\b${word.toLowerCase()}\\b`, 'i').test(lower)
      );
    });

    if (found) {
      const word = FORBIDDEN_WORDS.find(w =>
        new RegExp(`\\b${w.toLowerCase()}\\b`, 'i').test(found.toLowerCase())
      );
      this.recommendationsError = `La palabra "${word}" infringe las normas de la comunidad`;
      return;
    }

    this.recommendationsError = '';
    if (clean.length === 0 && this.recommendations().length > 0) return;

    this.savingRecommendations = true;
    const data = {recommendations: clean.join('\n')};

    this.publicationService.updatePublication(this.publication()!._id, data).subscribe({
      next: () => {
        this.recommendations.set(clean);
        this.publication.update(pub => {
          if (!pub) return pub;
          return {...pub, recommendations: clean.join('\n')};
        });
        this.editingRecommendations.set(false);
        this.savingRecommendations = false;
      },
      error: () => {
        this.savingRecommendations = false;
      }
    });
  }

  startEditingIntro(): void {
    this.introInput = this.introText();
    this.editingIntro.set(true);
  }

  cancelEditingIntro(): void {
    this.editingIntro.set(false);
  }

  saveIntro(): void {
    const found = FORBIDDEN_WORDS.find(word =>
      new RegExp(`\\b${word.toLowerCase()}\\b`, 'i').test(this.introInput.toLowerCase())
    );

    if (found) {
      this.introError = `La palabra "${found}" infringe las normas de la comunidad`;
      return;
    }

    this.introError = '';
    this.savingIntro = true;
    this.publicationService.updatePublication(this.publication()!._id, {text: this.introInput}).subscribe({
      next: () => {
        this.introText.set(this.introInput);
        this.publication.update(pub => pub ? {...pub, text: this.introInput} : pub);
        this.editingIntro.set(false);
        this.savingIntro = false;
      },
      error: () => {
        this.savingIntro = false;
      }
    });
  }

  onDragStart(index: number): void {
    this.dragIndex = index;
  }

  onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    if (this.dragIndex === null || this.dragIndex === index) return;

    this.recommendations.update(current => {
      const updated = [...current];
      const dragged = updated.splice(this.dragIndex!, 1)[0];
      updated.splice(index, 0, dragged);
      this.dragIndex = index;
      return updated;
    });
  }

  onDragEnd(): void {
    this.dragIndex = null;
  }
}
