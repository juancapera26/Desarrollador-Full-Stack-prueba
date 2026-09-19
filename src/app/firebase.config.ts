import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Config pública del SDK web de Firebase para el proyecto "catalogo-productos-77ab0".
// Las claves de un proyecto Firebase para cliente web no son secretas: el acceso a los
// datos se protege con las reglas de seguridad de Firestore, no ocultando esta config.
const firebaseConfig = {
  apiKey: 'AIzaSyDIff8s0UhNwbr9tjGNXKxLdtbxJyFFmq0',
  authDomain: 'catalogo-productos-77ab0.firebaseapp.com',
  projectId: 'catalogo-productos-77ab0',
  storageBucket: 'catalogo-productos-77ab0.firebasestorage.app',
  messagingSenderId: '907993303542',
  appId: '1:907993303542:android:4716c543d6b28d9f7c9fd7',
};

const firebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
