import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent } from '@ionic/angular/standalone';
import { PointsSummary } from '../../models/points-summary.model';
import { AuthService } from '../../services/auth.service';
import { PointsService } from '../../services/points.service';

@Component({
  selector: 'app-points-page',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, IonContent, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle],
  templateUrl: './points.page.html',
  styleUrl: './points.page.scss',
})
export class PointsPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly pointsService = inject(PointsService);
  private readonly router = inject(Router);

  summary: PointsSummary | null = null;
  loading = true;
  errorMessage = '';

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadSummary(currentUser.id);
  }

  async loadSummary(userId = this.authService.getCurrentUser()?.id): Promise<void> {
    if (!userId) return;

    this.loading = true;
    this.errorMessage = '';
    try {
      this.summary = await this.pointsService.getSummary(userId);
    } catch {
      this.summary = null;
      this.errorMessage = 'No pudimos cargar tus puntos. Intenta nuevamente.';
    } finally {
      this.loading = false;
    }
  }

  goToCatalog(): void {
    this.router.navigateByUrl('/home');
  }
}
