/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { Cart } from '../models/cart.model';
import { OrderService } from './order.service';

let emulatorConnected = false;

async function clearOrdersCollection(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'orders'));
  await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
}

async function clearCollection(collectionName: string): Promise<void> {
  const snapshot = await getDocs(collection(db, collectionName));
  await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
}

describe('OrderService', () => {
  let service: OrderService;
  const cart: Cart = {
    userId: 'user-1',
    items: [
      {
        product: {
          id: 1,
          name: 'Camiseta urbana',
          description: 'Camiseta de prueba',
          price: 45000,
          stock: 3,
          image: 'https://picsum.photos/id/1/800/600',
        },
        quantity: 2,
      },
    ],
  };

  beforeAll(() => {
    if (!emulatorConnected) {
      connectFirestoreEmulator(db, '127.0.0.1', 8085);
      emulatorConnected = true;
    }
  });

  beforeEach(async () => {
    await clearOrdersCollection();
    await clearCollection('products');
    await clearCollection('carts');
    await setDoc(doc(db, 'products', '1'), cart.items[0].product);
    await setDoc(doc(db, 'carts', 'user-1'), cart);
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderService);
  });

  it('creates a confirmed order with lines and total', async () => {
    const result = await service.createOrder('user-1', cart);

    expect(result.ok).toBeTrue();
    if (!result.ok) return;

    expect(result.order.id).toBeTruthy();
    expect(result.order.userId).toBe('user-1');
    expect(result.order.status).toBe('CONFIRMED');
    expect(result.order.items[0]).toEqual(jasmine.objectContaining({ productId: 1, quantity: 2, subtotal: 90000 }));
    expect(result.order.total).toBe(90000);

    const snapshot = await getDocs(collection(db, 'orders'));
    expect(snapshot.docs).toHaveSize(1);
  });

  it('decrements inventory and clears the persisted cart atomically', async () => {
    const result = await service.createOrder('user-1', cart);

    expect(result.ok).toBeTrue();
    expect((await getDoc(doc(db, 'products', '1'))).data()?.['stock']).toBe(1);
    expect((await getDoc(doc(db, 'carts', 'user-1'))).data()).toEqual({ userId: 'user-1', items: [] });
  });

  it('rejects an empty cart, a different user, and quantities over stock', async () => {
    expect(await service.createOrder('user-1', { userId: 'user-1', items: [] })).toEqual({ ok: false, reason: 'empty-cart' });
    expect(await service.createOrder('user-2', cart)).toEqual({ ok: false, reason: 'user-mismatch' });

    const overStockCart: Cart = {
      ...cart,
      items: [{ ...cart.items[0], quantity: 4 }],
    };
    expect(await service.createOrder('user-1', overStockCart)).toEqual({ ok: false, reason: 'invalid-stock' });
  });
});
