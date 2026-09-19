import { Injectable } from '@angular/core';
import { collection, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';
import { isProduct } from '../models/data-guards';

export type CreateOrderResult =
  | { ok: true; order: Order }
  | { ok: false; reason: 'empty-cart' | 'user-mismatch' | 'invalid-stock' | 'unknown-error' };

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly ordersCollection = collection(db, 'orders');
  private readonly cartsCollection = 'carts';
  private readonly productsCollection = 'products';

  async createOrder(userId: string, cart: Cart): Promise<CreateOrderResult> {
    if (cart.userId !== userId) return { ok: false, reason: 'user-mismatch' };
    if (!cart.items.length) return { ok: false, reason: 'empty-cart' };

    const hasInvalidStock = cart.items.some(
      (item) => item.product.stock < 1 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > item.product.stock,
    );
    if (hasInvalidStock) return { ok: false, reason: 'invalid-stock' };

    try {
      const order = await runTransaction(db, async (transaction) => {
        const productRefs = cart.items.map((item) => doc(db, this.productsCollection, String(item.product.id)));
        const productSnapshots = await Promise.all(productRefs.map((productRef) => transaction.get(productRef)));
        const currentCartSnapshot = await transaction.get(doc(db, this.cartsCollection, userId));

        const items = cart.items.map((item, index) => {
          const rawProduct: unknown = productSnapshots[index].data();
          if (!isProduct(rawProduct) || rawProduct.stock < item.quantity) throw new Error('invalid-stock');
          const product = rawProduct;

          transaction.update(productRefs[index], { stock: product.stock - item.quantity });
          return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity,
            subtotal: product.price * item.quantity,
          };
        });

        if (!currentCartSnapshot.exists()) throw new Error('empty-cart');

        const order: Order = {
          id: crypto.randomUUID(),
          userId,
          status: 'CONFIRMED',
          items,
          total: items.reduce((total, item) => total + item.subtotal, 0),
          createdAt: new Date().toISOString(),
        };

        transaction.set(doc(this.ordersCollection, order.id), order);
        transaction.set(doc(db, this.cartsCollection, userId), { userId, items: [] });
        return order;
      });

      return { ok: true, order };
    } catch (error) {
      if (error instanceof Error && ['empty-cart', 'invalid-stock'].includes(error.message)) {
        return { ok: false, reason: error.message as 'empty-cart' | 'invalid-stock' };
      }
      console.error('[OrderService] No se pudo crear el pedido.', error);
      return { ok: false, reason: 'unknown-error' };
    }
  }
}
