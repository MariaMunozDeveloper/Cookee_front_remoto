import {inject, Component, signal, WritableSignal, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MessageService} from '../../../services/messageService';
import {UserService} from '../../../services/userService';

@Component({
  selector: 'app-send-message',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './send-message.html',
  styleUrl: './send-message.css'
})
export class SendMessageComponent implements OnInit {
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly messageService: MessageService = inject(MessageService);
  private readonly userService: UserService = inject(UserService);

  receiver: WritableSignal<any> = signal<any>(null);
  messageText: string = '';
  sending: boolean = false;
  sent: boolean = false;
  errorMessage: string = '';

  ngOnInit(): void {
    const userId = this.route.snapshot.params['id'];
    this.userService.getUserById(userId).subscribe({
      next: (response: any) => {
        this.receiver.set(response.user);
      }
    });
  }

  sendMessage(): void {
    if (!this.messageText.trim()) {
      this.errorMessage = 'Escribe algo antes de enviar.';
      return;
    }

    this.sending = true;
    this.errorMessage = '';

    this.messageService.sendMessage(this.receiver()._id, this.messageText.trim()).subscribe({
      next: () => {
        this.sent = true;
        this.messageText = '';
        this.sending = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo enviar el mensaje.';
        this.sending = false;
      }
    });
  }
}
