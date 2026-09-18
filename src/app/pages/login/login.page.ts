import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonInput, IonItem, IonNote, IonText } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IonContent, IonItem, IonInput, IonNote, IonText, IonButton],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private returnUrl = '/home';

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submitted = false;
  submitting = false;
  errorMessage = '';

  ngOnInit(): void {
    const requestedUrl = this.activatedRoute.snapshot.queryParamMap.get('returnUrl');
    if (requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//')) {
      this.returnUrl = requestedUrl;
    }

    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  async submit(): Promise<void> {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid || this.submitting) return;

    const value = this.loginForm.getRawValue();
    this.submitting = true;
    try {
      const result = await this.authService.login(value.email, value.password);
      if (!result.ok) {
        this.errorMessage =
          result.reason === 'invalid-credentials'
            ? 'Correo o contraseña incorrectos.'
            : 'No se pudo iniciar sesión. Intenta nuevamente.';
        return;
      }

      this.router.navigateByUrl(this.returnUrl);
    } finally {
      this.submitting = false;
    }
  }

  hasError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }
}
