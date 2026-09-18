/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { collection, connectFirestoreEmulator, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Product } from '../models/product.model';
import { CartService } from './cart.service';

let emulatorConnected = false;

async function clearCartsCollection(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'carts'));
  await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
}

describe('CartService', () => {
  let service: CartService;
  const product: Product = {
    id: 1,
    name: 'Camiseta urbana',
    description: 'Camiseta de prueba',
    price: 45000,
    stock: 2,
    image: 'https://picsum.photos/id/1/800/600',
  };

  beforeAll(() => {
    if (!emulatorConnected) {
      try {
        connectFirestoreEmulator(db, '127.0.0.1', 8085);
      } catch {
        // Another spec may have connected the shared Firestore instance first.
      }
      emulatorConnected = true;
    }
  });

  beforeEach(async () => {
    await clearCartsCollection();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('adds a product with quantity one and groups a second addition', async () => {
    const first = await service.addToCart('user-1', product);
    const second = await service.addToCart('user-1', product);

    expect(first).toEqual(jasmine.objectContaining({ ok: true }));
    expect(second).toEqual({ ok: true, cart: { userId: 'user-1', items: [{ product, quantity: 2 }] } });
  });

  it('rejects an unavailable product and never exceeds its stock', async () => {
    const unavailable = await service.addToCart('user-1', { ...product, stock: 0 });
    await service.addToCart('user-1', product);
    await service.addToCart('user-1', product);
    const third = await service.addToCart('user-1', product);

    expect(unavailable).toEqual({ ok: false, reason: 'out-of-stock' });
    expect(third).toEqual({ ok: false, reason: 'out-of-stock' });
    await expectAsync(service.getCart('user-1')).toBeResolvedTo({ userId: 'user-1', items: [{ product, quantity: 2 }] });
  });

  it('updates quantity, calculates the total, removes an item and clears the cart', async () => {
    await service.addToCart('user-1', product);
    await service.addToCart('user-1', { ...product, id: 2, name: 'Mochila', price: 120000, stock: 7 });

    const updated = await service.updateQuantity('user-1', product.id, 2);
    expect(updated).toEqual(jasmine.objectContaining({ ok: true }));
    if (updated.ok) expect(service.getTotal(updated.cart)).toBe(210000);

    expect(await service.updateQuantity('user-1', product.id, 0)).toEqual({ ok: false, reason: 'invalid-quantity' });
    expect(await service.updateQuantity('user-1', product.id, 3)).toEqual({ ok: false, reason: 'invalid-quantity' });
    expect((await service.removeItem('user-1', product.id)).items.map((item) => item.product.id)).toEqual([2]);
    expect(await service.clearCart('user-1')).toEqual({ userId: 'user-1', items: [] });
  });
});
