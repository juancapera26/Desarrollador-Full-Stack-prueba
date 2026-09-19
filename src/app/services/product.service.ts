import { Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { from, map, Observable } from 'rxjs';
import { db } from '../firebase.config';
import { isProduct } from '../models/data-guards';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productsCollection = collection(db, 'products');
  private readonly localImages: Record<number, string> = {
    1: 'assets/images/products/camiseta-urbana.svg',
    2: 'assets/images/products/mochila-exploradora.svg',
    3: 'assets/images/products/reloj-clasico.svg',
  };

  getProducts(): Observable<Product[]> {
    return from(getDocs(this.productsCollection)).pipe(
      map((snapshot) => {
        const products: Product[] = [];
        snapshot.docs.forEach((productSnapshot) => {
          const data: unknown = productSnapshot.data();
          if (isProduct(data)) {
            const usesPlaceholderImage = data.image.includes('picsum.photos');
            products.push(usesPlaceholderImage && this.localImages[data.id]
              ? { ...data, image: this.localImages[data.id] }
              : data);
          } else {
            console.warn(`[ProductService] Producto inválido ignorado: ${productSnapshot.id}`);
          }
        });
        return products.sort((first, second) => first.id - second.id);
      }),
    );
  }
}
