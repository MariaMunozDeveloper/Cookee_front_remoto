import {Component, Input} from '@angular/core';
import {RouterLink} from '@angular/router';
import {inject} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './user-card.html',
  styleUrl: './user-card.css'
})
export class UserCardComponent {
  private readonly router: Router = inject(Router);

  @Input() user: any;
  @Input() stats: any;

  @Input() showEmail: boolean = false;
  @Input() showStats: boolean = false;

  @Input() buttonText: string = '';
  @Input() buttonLink: string = '';

  @Input() profileId: string = '';

  onProfileClick(): void {
    if (this.profileId) {
      this.router.navigate(['/profile', this.profileId]);
    }
  }

}
