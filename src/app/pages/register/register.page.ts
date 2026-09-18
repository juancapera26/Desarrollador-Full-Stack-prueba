import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonContent, IonInput, IonItem, IonNote, IonText } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonItem, IonInput, IonNote, IonText, IonButton],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  submitted = false;
  successMessage = '';
  errorMessage = '';

  submit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.registerForm.invalid) return;

    const value = this.registerForm.getRawValue();
    if (value.password !== value.confirmPassword) {
      this.registerForm.controls.confirmPassword.setErrors({ passwordMismatch: true });
      this.errorMessage = 'Las contraseñas deben coincidir.';
      return;
    }

    const result = this.authService.register({ name: value.name.trim(), email: value.email, password: value.password });
    if (!result.ok) {
      this.errorMessage = 'Ya existe un usuario registrado con ese correo.';
      return;
    }

    this.successMessage = 'Registro exitoso. Tu cuenta fue creada correctamente.';
    this.registerForm.reset();
    this.submitted = false;
  }

  hasError(controlName: 'name' | 'email' | 'password' | 'confirmPassword'): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }
}
