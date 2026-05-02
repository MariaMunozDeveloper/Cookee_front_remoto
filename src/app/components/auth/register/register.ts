import {inject, Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../services/authService';
import {UserService} from '../../../services/userService';
import {FormValidators} from '../../../validators/formValidators';
import {User} from '../../../common/interfaces/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly userService: UserService = inject(UserService);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly router: Router = inject(Router);

  registerForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, FormValidators.notOnlyWhiteSpace]],
    surname: ['', [Validators.required, FormValidators.notOnlyWhiteSpace]],
    nick: ['', [Validators.required, Validators.minLength(3), FormValidators.notOnlyWhiteSpace, FormValidators.forbiddenWord('admin')]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), FormValidators.notOnlyWhiteSpace]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const user: User = this.registerForm.value;

    // registro y login automático
    this.authService.register(user).subscribe({
      next: () => {
        this.authService.login({
          email: user.email,
          password: user.password!
        }).subscribe({
          next: (response) => {
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);
            this.authService.setIdentity(response.user);

            this.userService.getCounters().subscribe({
              next: (statsResponse: any) => {
                localStorage.setItem('stats', JSON.stringify(statsResponse));
                this.router.navigate(['/feed']);
              },
              error: () => {
                this.router.navigate(['/feed']);
              }
            });
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
      },
      error: () => {
      }
    });
  }
}
