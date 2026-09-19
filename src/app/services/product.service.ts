import { Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { from, map, Observable } from 'rxjs';
import { db } from '../firebase.config';
import { isProduct } from '../models/data-guards';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productsCollection = collection(db, 'products');

  getProducts(): Observable<Product[]> {
    return from(getDocs(this.productsCollection)).pipe(
      map((snapshot) => {
        const products: Product[] = [];
        snapshot.docs.forEach((productSnapshot) => {
          const data: unknown = productSnapshot.data();
          if (isProduct(data)) {
            products.push(data);
          } else {
            console.warn(`[ProductService] Producto inválido ignorado: ${productSnapshot.id}`);
          }
        });
        return products.sort((first, second) => first.id - second.id);
      }),
    );
  }
}
