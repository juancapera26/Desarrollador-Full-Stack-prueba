import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyDIff8s0UhNwbr9tjGNXxLdtbxJyFFmq0',
  authDomain: 'catalogo-productos-77ab0.firebaseapp.com',
  projectId: 'catalogo-productos-77ab0',
  storageBucket: 'catalogo-productos-77ab0.firebasestorage.app',
  messagingSenderId: '907993303542',
  appId: '1:907993303542:android:4716c543d6b28d9f7c9fd7',
});

const db = getFirestore(app);
const products = [
  {
    id: 1,
    name: 'Camiseta urbana',
    description: 'Algodon suave, corte regular y acabado ligero para combinar a diario.',
    price: 45000,
    stock: 12,
    image: 'assets/images/products/camiseta-urbana.svg',
  },
  {
    id: 2,
    name: 'Mochila exploradora',
    description: 'Compartimento principal amplio y tiras acolchadas para llevar tus esenciales.',
    price: 120000,
    stock: 7,
    image: 'assets/images/products/mochila-exploradora.svg',
  },
  {
    id: 3,
    name: 'Reloj clasico',
    description: 'Caja metalica y correa clasica para completar looks de oficina o fin de semana.',
    price: 185000,
    stock: 0,
    image: 'assets/images/products/reloj-clasico.svg',
  },
];

for (const product of products) {
  const reference = doc(db, 'products', String(product.id));
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    await setDoc(reference, product);
    console.log(`Creado products/${product.id} con stock ${product.stock}`);
  } else {
    console.log(`Conservado products/${product.id} con stock ${snapshot.data().stock}`);
  }
}
