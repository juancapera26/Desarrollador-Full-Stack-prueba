import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Cart } from '../models/cart.model';
import { isCart } from '../models/data-guards';
import { Product } from '../models/product.model';

export type AddToCartResult =
  | { ok: true; cart: Cart }
  | { ok: false; reason: 'out-of-stock' | 'unknown-error' };

export type UpdateCartResult =
  | { ok: true; cart: Cart }
  | { ok: false; reason: 'item-not-found' | 'invalid-quantity' | 'unknown-error' };

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly cartsCollection = 'carts';

  async getCart(userId: string): Promise<Cart> {
    const snapshot = await getDoc(doc(db, this.cartsCollection, userId));
    if (!snapshot.exists()) return { userId, items: [] };

    const data: unknown = snapshot.data();
    if (!isCart(data) || data.userId !== userId) {
      throw new Error('invalid-cart-data');
    }
    return { userId, items: data.items };
  }

  async addToCart(userId: string, product: Product): Promise<AddToCartResult> {
    if (product.stock < 1) return { ok: false, reason: 'out-of-stock' };

    try {
      const cart = await this.getCart(userId);
      const existingItem = cart.items.find((item) => item.product.id === product.id);
      const currentQuantity = existingItem?.quantity ?? 0;

      if (currentQuantity >= product.stock) {
        return { ok: false, reason: 'out-of-stock' };
      }

      const items = existingItem
        ? cart.items.map((item) =>
            item.product.id === product.id ? { ...item, product, quantity: item.quantity + 1 } : item,
          )
        : [...cart.items, { product, quantity: 1 }];
      const updatedCart: Cart = { userId, items };

      await setDoc(doc(db, this.cartsCollection, userId), updatedCart);
      return { ok: true, cart: updatedCart };
    } catch (error) {
      console.error('[CartService] No se pudo agregar el producto.', error);
      return { ok: false, reason: 'unknown-error' };
    }
  }

  async updateQuantity(userId: string, productId: number, quantity: number): Promise<UpdateCartResult> {
    try {
      const cart = await this.getCart(userId);
      const item = cart.items.find((cartItem) => cartItem.product.id === productId);
      if (!item) return { ok: false, reason: 'item-not-found' };
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.product.stock) {
        return { ok: false, reason: 'invalid-quantity' };
      }

      const updatedCart: Cart = {
        userId,
        items: cart.items.map((cartItem) =>
          cartItem.product.id === productId ? { ...cartItem, quantity } : cartItem,
        ),
      };
      await this.saveCart(updatedCart);
      return { ok: true, cart: updatedCart };
    } catch (error) {
      console.error('[CartService] No se pudo actualizar la cantidad.', error);
      return { ok: false, reason: 'unknown-error' };
    }
  }

  async removeItem(userId: string, productId: number): Promise<Cart> {
    const cart = await this.getCart(userId);
    const updatedCart: Cart = { userId, items: cart.items.filter((item) => item.product.id !== productId) };
    await this.saveCart(updatedCart);
    return updatedCart;
  }

  async clearCart(userId: string): Promise<Cart> {
    const emptyCart: Cart = { userId, items: [] };
    await this.saveCart(emptyCart);
    return emptyCart;
  }

  getTotal(cart: Cart): number {
    return cart.items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }

  private saveCart(cart: Cart): Promise<void> {
    return setDoc(doc(db, this.cartsCollection, cart.userId), cart);
  }
}
