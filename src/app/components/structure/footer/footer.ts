import {Component, inject} from '@angular/core';
import {RouterLink, Router} from '@angular/router';
import {AuthService} from '../../../services/authService';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class FooterComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);


  get identity(): any {
    return this.authService.getIdentity();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
