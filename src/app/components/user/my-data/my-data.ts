import {inject, Component} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FormValidators} from '../../../validators/formValidators';
import {AuthService} from '../../../services/authService';
import {UserService} from '../../../services/userService';

@Component({
  selector: 'app-my-data',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './my-data.html',
  styleUrl: './my-data.css'
})
export class MyDataComponent {
  private readonly authService: AuthService = inject(AuthService);
  private readonly userService: UserService = inject(UserService);
  private readonly formBuilder: FormBuilder = inject(FormBuilder);

  identity: any = this.authService.getIdentity();
  status: string = '';
  errorMessage: string = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  myDataForm: FormGroup = this.formBuilder.group({
    name: [this.identity?.name || '', [Validators.required, FormValidators.notOnlyWhiteSpace]],
    surname: [this.identity?.surname || '', [Validators.required, FormValidators.notOnlyWhiteSpace]],
    nick: [this.identity?.nick || '', [Validators.required, Validators.minLength(3), FormValidators.notOnlyWhiteSpace]],
    email: [this.identity?.email || '', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.myDataForm.invalid) {
      this.myDataForm.markAllAsTouched();
      return;
    }

    this.userService.updateUser(this.myDataForm.value).subscribe({
      next: (response: any) => {
        this.status = 'success';
        this.identity = response.user;
        this.authService.setIdentity(response.user);

        if (this.selectedFile) {
          this.userService.uploadAvatar(this.selectedFile).subscribe({
            next: (avatarResponse: any) => {
              this.identity = avatarResponse.user;
              this.authService.setIdentity(avatarResponse.user);
              this.previewUrl = null;
              this.selectedFile = null;
            },
            error: (error: any) => {
              console.error(error);
            }
          });
        }
      },
      error: (error: any) => {
        if (error.status === 409) {
          this.status = 'duplicate';
          this.errorMessage = error.error.message;
        } else if (error.status === 401) {
          this.status = 'unauthorized';
          this.errorMessage = 'Tu sesión ha caducado. Vuelve a iniciar sesión';
        } else {
          this.status = 'error';
          this.errorMessage = 'Ha ocurrido un error al actualizar los datos';
        }
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  cancelAvatarChange(): void {
    this.selectedFile = null;
    this.previewUrl = null;
  }
}
