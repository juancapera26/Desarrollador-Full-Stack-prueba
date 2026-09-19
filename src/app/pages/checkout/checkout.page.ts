import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { Router } from "@angular/router";
import { IonButton, IonContent } from "@ionic/angular/standalone";
import { Cart } from "../../models/cart.model";
import { SessionUser } from "../../models/session-user.model";
import { AuthService } from "../../services/auth.service";
import { CartService } from "../../services/cart.service";
import { Order } from "../../models/order.model";
import { OrderService } from "../../services/order.service";

@Component({
  selector: "app-checkout-page",
  standalone: true,
  imports: [CommonModule, CurrencyPipe, IonContent, IonButton],
  templateUrl: "./checkout.page.html",
  styleUrl: "./checkout.page.scss",
})
export class CheckoutPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);

  currentUser: SessionUser | null = null;
  cart: Cart | null = null;
  loading = true;
  errorMessage = "";
  confirmationMessage = "";
  confirmedOrder: Order | null = null;
  submitting = false;

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.router.navigateByUrl("/login");
      return;
    }

    this.loadCart();
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

  get total(): number {
    return this.cart ? this.cartService.getTotal(this.cart) : 0;
  }

  async confirmOrder(): Promise<void> {
    const activeUser = this.authService.getCurrentUser();
    if (!activeUser || !this.cart?.items.length || this.submitting) return;

    this.submitting = true;
    this.errorMessage = "";
    this.confirmationMessage = "";
    try {
      const result = await this.orderService.createOrder(
        activeUser.id,
        this.cart,
      );
      if (!result.ok) {
        this.errorMessage =
          result.reason === "empty-cart"
            ? "Agrega productos antes de confirmar la compra."
            : result.reason === "invalid-stock"
              ? "El stock cambió. Revisa las cantidades del carrito."
              : "No pudimos confirmar tu pedido. Intenta nuevamente.";
        return;
      }

      this.confirmedOrder = result.order;
      this.confirmationMessage = "Tu pedido fue confirmado correctamente.";
      this.cart = { userId: activeUser.id, items: [] };
    } catch {
      this.errorMessage = "No pudimos confirmar tu pedido. Intenta nuevamente.";
    } finally {
      this.submitting = false;
    }
  }

  goToCart(): void {
    this.router.navigateByUrl("/cart");
  }
}
