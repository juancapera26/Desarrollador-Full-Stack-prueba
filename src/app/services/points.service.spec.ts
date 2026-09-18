/// <reference types="jasmine" />

import { collection, connectFirestoreEmulator, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { PointsSummary } from '../models/points-summary.model';
import { PointsService } from './points.service';

let emulatorConnected = false;

async function clearOrdersCollection(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'orders'));
  await Promise.all(snapshot.docs.map((orderSnapshot) => deleteDoc(orderSnapshot.ref)));
}

describe('PointsService sales points', () => {
  let service: PointsService;

  beforeEach(() => {
    service = new PointsService();
  });

  beforeAll(() => {
    if (!emulatorConnected) {
      connectFirestoreEmulator(db, '127.0.0.1', 8085);
      emulatorConnected = true;
    }
  });

  it('returns zero points below ten percent of the quarterly quota', () => {
    expect(service.calculateSalesPoints(0)).toBe(0);
    expect(service.calculateSalesPoints(990_000)).toBe(0);
  });

  it('returns twenty points from ten percent up to twenty-nine percent', () => {
    expect(service.calculateSalesPoints(1_100_000)).toBe(20);
    expect(service.calculateSalesPoints(3_190_000)).toBe(20);
  });

  it('returns forty points from thirty percent up to forty-nine percent', () => {
    expect(service.calculateSalesPoints(3_300_000)).toBe(40);
    expect(service.calculateSalesPoints(5_390_000)).toBe(40);
  });

  it('returns seventy points from fifty percent up to seventy-nine percent', () => {
    expect(service.calculateSalesPoints(5_500_000)).toBe(70);
    expect(service.calculateSalesPoints(8_690_000)).toBe(70);
  });

  it('returns one hundred points from eighty percent, including overachievement', () => {
    expect(service.calculateSalesPoints(8_800_000)).toBe(100);
    expect(service.calculateSalesPoints(11_000_000)).toBe(100);
    expect(service.calculateSalesPoints(15_000_000)).toBe(100);
  });

  it('treats negative sales as zero', () => {
    expect(service.calculateSalesPoints(-1)).toBe(0);
  });

  it('returns zero points for fewer than one thousand units', () => {
    expect(service.calculateVolumePoints(0)).toBe(0);
    expect(service.calculateVolumePoints(999)).toBe(0);
  });

  it('returns fifty points from one thousand up to two thousand nine hundred ninety-nine units', () => {
    expect(service.calculateVolumePoints(1_000)).toBe(50);
    expect(service.calculateVolumePoints(2_999)).toBe(50);
  });

  it('returns one hundred points from three thousand up to three thousand nine hundred ninety-nine units', () => {
    expect(service.calculateVolumePoints(3_000)).toBe(100);
    expect(service.calculateVolumePoints(3_999)).toBe(100);
  });

  it('returns one hundred fifty points from four thousand units, including overachievement', () => {
    expect(service.calculateVolumePoints(4_000)).toBe(150);
    expect(service.calculateVolumePoints(6_000)).toBe(150);
  });

  it('treats negative units as zero', () => {
    expect(service.calculateVolumePoints(-1)).toBe(0);
  });

  it('builds a summary from only the current user orders', async () => {
    await clearOrdersCollection();
    const orders = [
      { id: 'order-1', userId: 'user-1', status: 'CONFIRMED', total: 1_100_000, items: [{ productId: 1, name: 'Producto 1', price: 1_100_000, quantity: 1, subtotal: 1_100_000 }], createdAt: '2026-01-01' },
      { id: 'order-2', userId: 'user-1', status: 'CONFIRMED', total: 2_200_000, items: [{ productId: 2, name: 'Producto 2', price: 1_100, quantity: 2_000, subtotal: 2_200_000 }], createdAt: '2026-02-01' },
      { id: 'order-other-user', userId: 'user-2', status: 'CONFIRMED', total: 11_000_000, items: [{ productId: 3, name: 'Producto 3', price: 11_000_000, quantity: 1, subtotal: 11_000_000 }], createdAt: '2026-03-01' },
    ];
    await Promise.all(orders.map((order) => setDoc(doc(db, 'orders', order.id), order)));

    const summary: PointsSummary = await service.getSummary('user-1');

    expect(summary).toEqual({ totalSales: 3_300_000, totalUnits: 2_001, salesPoints: 40, volumePoints: 50, totalPoints: 90, orderCount: 2 });
  });

  it('returns an empty summary when the user has no orders', async () => {
    await clearOrdersCollection();

    await expectAsync(service.getSummary('user-without-orders')).toBeResolvedTo({
      totalSales: 0,
      totalUnits: 0,
      salesPoints: 0,
      volumePoints: 0,
      totalPoints: 0,
      orderCount: 0,
    });
  });
});
