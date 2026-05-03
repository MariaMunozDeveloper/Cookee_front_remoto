import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/structure/navbar/navbar';
import { FooterComponent } from './components/structure/footer/footer';
import { AuthService } from './services/authService';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly authService: AuthService = inject(AuthService);

  ngOnInit(): void {
    this.authService.refreshIdentity();
  }
}
