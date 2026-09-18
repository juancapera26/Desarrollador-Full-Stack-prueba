import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyDIff8s0UhNwbr9tjGNXxLdtbxJyFFmq0',
  authDomain: 'catalogo-productos-77ab.firebaseapp.com',
  projectId: 'catalogo-productos-77ab',
  storageBucket: 'catalogo-productos-77ab.firebasestorage.app',
  messagingSenderId: '907993303542',
  appId: '1:907993303542:android:4716c543d6b28d9f7c9fd7',
});

const db = getFirestore(app);
const products = [
  {
    id: 1,
    name: 'Camiseta urbana',
    description: 'Camiseta comoda de algodon para uso diario.',
    price: 45000,
    stock: 12,
    image: 'https://picsum.photos/id/1/800/600',
  },
  {
    id: 2,
    name: 'Mochila exploradora',
    description: 'Mochila resistente para acompanarte en tus recorridos.',
    price: 120000,
    stock: 7,
    image: 'https://picsum.photos/id/2/800/600',
  },
  {
    id: 3,
    name: 'Reloj clasico',
    description: 'Reloj de diseno sobrio para cualquier ocasion.',
    price: 185000,
    stock: 0,
    image: 'https://picsum.photos/id/3/800/600',
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
