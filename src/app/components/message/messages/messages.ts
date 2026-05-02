import {inject, Component, signal, WritableSignal, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MessageService} from '../../../services/messageService';
import {AuthService} from '../../../services/authService';
import {Message} from '../../../common/interfaces/message';
import {LoadingSpinner} from '../../shared/loading-spinner/loading-spinner';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [RouterLink, LoadingSpinner],
  templateUrl: './messages.html',
  styleUrl: './messages.css'
})
export class MessagesComponent implements OnInit {
  private readonly messageService: MessageService = inject(MessageService);
  private readonly authService: AuthService = inject(AuthService);

  identity: any = this.authService.getIdentity();
  activeTab: 'received' | 'sent' = 'received';

  messages: WritableSignal<Message[]> = signal<Message[]>([]);
  loading: WritableSignal<boolean> = signal<boolean>(false);
  page: number = 1;
  totalPages: number = 1;

  ngOnInit(): void {
    this.loadMessages();
  }

  setTab(tab: 'received' | 'sent'): void {
    this.activeTab = tab;
    this.page = 1;
    this.messages.set([]);
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading.set(true);

    const request = this.activeTab === 'received'
      ? this.messageService.getReceived(this.page)
      : this.messageService.getSent(this.page);

    request.subscribe({
      next: (msgs: Message[]) => {
        this.messages.set(msgs);
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
      this.loadMessages();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadMessages();
    }
  }

  getOtherUser(message: any): any {
    return this.activeTab === 'received' ? message.emitter : message.receiver;
  }

  getTimeAgo(date: string | undefined): string {
    if (!date) return '';
    const now = new Date();
    const created = new Date(date);
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return created.toLocaleDateString('es-ES', {day: 'numeric', month: 'long'});
  }

  deleteMessage(id: string): void {
    this.messageService.removeMessage(id).subscribe({
      next: () => {
        this.messages.update(current => current.filter(m => m._id !== id));
      },
      error: () => {
      }
    });
  }
}
