import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
} from "@ionic/angular/standalone";
import { Cart } from "../../models/cart.model";
import { CartItem } from "../../models/cart-item.model";
import { SessionUser } from "../../models/session-user.model";
import { AuthService } from "../../services/auth.service";
import { CartService } from "../../services/cart.service";

@Component({
  selector: "app-cart-page",
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonInput,
  ],
  templateUrl: "./cart.page.html",
  styleUrl: "./cart.page.scss",
})
export class CartPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  currentUser: SessionUser | null = null;
  cart: Cart | null = null;
  loading = true;
  errorMessage = "";
  actionMessage = "";
  readonly busyProductIds = new Set<number>();
  clearing = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigateByUrl("/login");
      return;
    }

    this.loadCart();
  }

  ionViewWillEnter(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.loadCart();
    }
  }

  async loadCart(): Promise<void> {
    if (!this.currentUser) return;

    this.loading = true;
    this.errorMessage = "";
    try {
      this.cart = await this.cartService.getCart(this.currentUser.id);
    } catch {
      this.errorMessage = "No pudimos cargar tu carrito. Intenta nuevamente.";
    } finally {
      this.loading = false;
    }
  }

  subtotal(item: CartItem): number {
    return item.product.price * item.quantity;
  }

  get total(): number {
    return this.cart ? this.cartService.getTotal(this.cart) : 0;
  }

  async changeQuantity(item: CartItem, amount: number): Promise<void> {
    if (!this.currentUser || this.busyProductIds.has(item.product.id)) return;

    const nextQuantity = item.quantity + amount;
    if (nextQuantity < 1 || nextQuantity > item.product.stock) return;

    await this.runItemAction(item.product.id, async () => {
      const result = await this.cartService.updateQuantity(
        this.currentUser!.id,
        item.product.id,
        nextQuantity,
      );
      if (result.ok) {
        this.cart = result.cart;
      } else {
        this.actionMessage = "La cantidad solicitada no está disponible.";
      }
    });
  }

  async setQuantity(
    item: CartItem,
    value: string | number | null | undefined,
  ): Promise<void> {
    const nextQuantity = Number(value);
    if (
      !Number.isInteger(nextQuantity) ||
      nextQuantity < 1 ||
      nextQuantity > item.product.stock
    ) {
      this.actionMessage = `La cantidad debe estar entre 1 y ${item.product.stock}.`;
      return;
    }

    if (nextQuantity === item.quantity) return;
    await this.runItemAction(item.product.id, async () => {
      const result = await this.cartService.updateQuantity(
        this.currentUser!.id,
        item.product.id,
        nextQuantity,
      );
      if (result.ok) {
        this.cart = result.cart;
      } else {
        this.actionMessage = `La cantidad debe estar entre 1 y ${item.product.stock}.`;
      }
    });
  }

  async removeItem(item: CartItem): Promise<void> {
    if (!this.currentUser || this.busyProductIds.has(item.product.id)) return;

    await this.runItemAction(item.product.id, async () => {
      this.cart = await this.cartService.removeItem(
        this.currentUser!.id,
        item.product.id,
      );
      this.actionMessage = `${item.product.name} fue eliminado del carrito.`;
    });
  }

  async clearCart(): Promise<void> {
    if (!this.currentUser || !this.cart?.items.length || this.clearing) return;

    this.clearing = true;
    this.actionMessage = "";
    try {
      this.cart = await this.cartService.clearCart(this.currentUser.id);
      this.actionMessage = "El carrito fue vaciado.";
    } catch {
      this.actionMessage = "No pudimos vaciar el carrito. Intenta nuevamente.";
    } finally {
      this.clearing = false;
    }
  }

  goToCatalog(): void {
    this.router.navigateByUrl("/home");
  }

  goToCheckout(): void {
    this.router.navigateByUrl("/checkout");
  }

  private async runItemAction(
    productId: number,
    action: () => Promise<void>,
  ): Promise<void> {
    this.busyProductIds.add(productId);
    this.actionMessage = "";
    try {
      await action();
    } catch {
      this.actionMessage =
        "No pudimos actualizar el carrito. Intenta nuevamente.";
    } finally {
      this.busyProductIds.delete(productId);
    }
  }
}
