import {inject, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterLink, ActivatedRoute} from '@angular/router';
import {AuthService} from '../../../services/authService';
import {UserService} from '../../../services/userService';
import {FormValidators} from '../../../validators/formValidators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  private readonly authService: AuthService = inject(AuthService);
  private readonly userService: UserService = inject(UserService);
  private readonly router: Router = inject(Router);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);

  showPassword: boolean = false;
  errorMessage: string = '';

  loginForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), FormValidators.notOnlyWhiteSpace]]
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['expired']) {
        this.errorMessage = 'Tu sesión ha expirado. Vuelve a iniciar sesión.';
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        this.authService.setIdentity(response.user);

        this.userService.getCounters().subscribe({
          next: (statsResponse: any) => {
            localStorage.setItem('stats', JSON.stringify(statsResponse));
            this.router.navigate(['/']);
          },
          error: () => {
            this.router.navigate(['/']);
          }
        });
      },
      error: (error) => {
        if (error.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else {
          this.errorMessage = 'Ha ocurrido un error. Inténtalo de nuevo.';
        }
      }
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
