import { Injectable } from '@angular/core';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase.config';
import { PointsSummary } from '../models/points-summary.model';
import { Order } from '../models/order.model';
import { isOrder } from '../models/data-guards';

@Injectable({ providedIn: 'root' })
export class PointsService {
  readonly quarterlySalesQuota = 11_000_000;
  private readonly ordersCollection = collection(db, 'orders');

  calculateSalesPoints(executedSales: number): number {
    const safeSales = Math.max(0, executedSales);
    const completionPercentage = (safeSales / this.quarterlySalesQuota) * 100;

    if (completionPercentage < 10) return 0;
    if (completionPercentage < 30) return 20;
    if (completionPercentage < 50) return 40;
    if (completionPercentage < 80) return 70;
    return 100;
  }

  calculateVolumePoints(soldUnits: number): number {
    const safeUnits = Math.max(0, soldUnits);

    if (safeUnits < 1_000) return 0;
    if (safeUnits < 3_000) return 50;
    if (safeUnits < 4_000) return 100;
    return 150;
  }

  async getSummary(userId: string): Promise<PointsSummary> {
    const ordersQuery = query(this.ordersCollection, where('userId', '==', userId));
    const snapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];
    snapshot.docs.forEach((orderSnapshot) => {
      const data: unknown = orderSnapshot.data();
      if (!isOrder(data)) throw new Error(`invalid-order-data:${orderSnapshot.id}`);
      orders.push(data);
    });
    const totalSales = orders.reduce((total, order) => total + order.total, 0);
    const totalUnits = orders.reduce(
      (total, order) => total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
      0,
    );
    const salesPoints = this.calculateSalesPoints(totalSales);
    const volumePoints = this.calculateVolumePoints(totalUnits);

    return {
      totalSales,
      totalUnits,
      salesPoints,
      volumePoints,
      totalPoints: salesPoints + volumePoints,
      orderCount: orders.length,
    };
  }
}
