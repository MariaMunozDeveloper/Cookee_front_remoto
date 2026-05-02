import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.css'
})
export class ConfirmModalComponent {
  @Input() title: string = '¿Estás segura?';
  @Input() message: string = 'Esta acción no se puede deshacer.';
  @Input() confirmText: string = 'Eliminar';
  @Input() cancelText: string = 'Cancelar';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
