import { Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { from, map, Observable } from 'rxjs';
import { db } from '../firebase.config';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productsCollection = collection(db, 'products');

  getProducts(): Observable<Product[]> {
    return from(getDocs(this.productsCollection)).pipe(
      map((snapshot) => snapshot.docs
        .map((productSnapshot) => productSnapshot.data() as Product)
        .sort((first, second) => first.id - second.id)),
    );
  }
}
