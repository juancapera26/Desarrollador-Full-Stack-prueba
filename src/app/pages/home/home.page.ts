import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonContent, IonImg } from '@ionic/angular/standalone';
import { Product } from '../../models/product.model';
import { Cart } from '../../models/cart.model';
import { SessionUser } from '../../models/session-user.model';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle, IonImg],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  currentUser: SessionUser | null = null;
  products: Product[] = [];
  loading = true;
  errorMessage = '';
  readonly brokenImageIds = new Set<number>();
  readonly addingProductIds = new Set<number>();
  cart: Cart | null = null;
  cartMessage = '';
  cartMessageType: 'success' | 'error' = 'success';
  private cartMessageTimer: ReturnType<typeof setTimeout> | undefined;

  ngOnInit(): void {
    this.loadProducts();
  }

  ionViewWillEnter(): void {
    this.loadProducts();
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadCart();
    } else {
      this.cart = null;
    }
  }

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.loading = false;
        this.errorMessage = 'No pudimos cargar el catalogo. Intenta nuevamente.';
      },
    });
  }

  markImageAsBroken(productId: number): void {
    this.brokenImageIds.add(productId);
  }

  async loadCart(): Promise<void> {
    if (!this.currentUser) return;

    try {
      this.cart = await this.cartService.getCart(this.currentUser.id);
    } catch {
      this.cart = { userId: this.currentUser.id, items: [] };
      this.showCartMessage('No pudimos cargar tu carrito. Intenta nuevamente.', 'error');
    }
  }

  quantityInCart(productId: number): number {
    return this.cart?.items.find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  get cartItemCount(): number {
    return this.cart?.items.reduce((total, item) => total + item.quantity, 0) ?? 0;
  }

  async addProduct(product: Product): Promise<void> {
    const activeUser = this.authService.getCurrentUser();
    if (!activeUser) {
      this.currentUser = null;
      this.cart = null;
      this.goToLogin();
      return;
    }

    if (product.stock < 1 || this.addingProductIds.has(product.id)) return;

    this.currentUser = activeUser;
    this.addingProductIds.add(product.id);
    this.clearCartMessage();
    try {
      const result = await this.cartService.addToCart(activeUser.id, product);
      if (!result.ok) {
        this.showCartMessage(
          result.reason === 'out-of-stock'
            ? product.name + ' no tiene mas unidades disponibles.'
            : 'No pudimos agregar el producto. Intenta nuevamente.',
          'error',
        );
        return;
      }

      this.cart = result.cart;
      this.showCartMessage(product.name + ' fue agregado al carrito.');
    } finally {
      this.addingProductIds.delete(product.id);
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  goToCart(): void {
    if (!this.authService.isAuthenticated()) {
      this.currentUser = null;
      this.cart = null;
      this.goToLogin();
      return;
    }

    this.router.navigateByUrl('/cart');
  }

  goToPoints(): void {
    this.router.navigateByUrl('/points');
  }

  goToLogin(): void {
    this.router.navigate(['/login'], { queryParams: { returnUrl: '/home' } });
  }

  private showCartMessage(message: string, type: 'success' | 'error' = 'success'): void {
    if (this.cartMessageTimer) clearTimeout(this.cartMessageTimer);
    this.cartMessage = message;
    this.cartMessageType = type;
    this.cartMessageTimer = setTimeout(() => {
      this.cartMessage = '';
      this.cartMessageTimer = undefined;
    }, 3200);
  }

  clearCartMessage(): void {
    if (this.cartMessageTimer) clearTimeout(this.cartMessageTimer);
    this.cartMessage = '';
    this.cartMessageTimer = undefined;
  }
}
