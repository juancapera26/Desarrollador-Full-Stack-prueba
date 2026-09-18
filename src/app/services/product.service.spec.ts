/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { collection, connectFirestoreEmulator, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { firstValueFrom } from 'rxjs';
import { db } from '../firebase.config';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

let emulatorConnected = false;

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    if (!emulatorConnected) {
      connectFirestoreEmulator(db, '127.0.0.1', 8085);
      emulatorConnected = true;
    }

    const snapshot = await getDocs(collection(db, 'products'));
    await Promise.all(snapshot.docs.map((productSnapshot) => deleteDoc(productSnapshot.ref)));
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('loads the three catalog products from Firestore ordered by product id', async () => {
    const products: Product[] = [
      { id: 1, name: 'Producto 1', description: 'Descripcion 1', price: 1000, stock: 4, image: 'image-1' },
      { id: 2, name: 'Producto 2', description: 'Descripcion 2', price: 2000, stock: 5, image: 'image-2' },
      { id: 3, name: 'Producto 3', description: 'Descripcion 3', price: 3000, stock: 6, image: 'image-3' },
    ];

    await Promise.all(products.map((product) => setDoc(doc(db, 'products', String(product.id)), product)));

    await expectAsync(firstValueFrom(service.getProducts())).toBeResolvedTo(products);
  });
});
