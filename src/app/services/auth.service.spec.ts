import { TestBed } from '@angular/core/testing';
import { collection, connectFirestoreEmulator, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase.config';
import { AuthService } from './auth.service';

let emulatorConnected = false;

async function clearUsersCollection(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'users'));
  await Promise.all(snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)));
}

describe('AuthService registration', () => {
  let service: AuthService;

  beforeAll(() => {
    if (!emulatorConnected) {
      connectFirestoreEmulator(db, '127.0.0.1', 8085);
      emulatorConnected = true;
    }
  });

  beforeEach(async () => {
    await clearUsersCollection();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('stores a newly registered user', async () => {
    const result = await service.register({ name: 'Ana Pérez', email: 'ANA@correo.com', password: 'secret1' });
    expect(result.ok).toBeTrue();

    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map((docSnapshot) => docSnapshot.data());
    expect(users).toEqual([jasmine.objectContaining({ name: 'Ana Pérez', email: 'ana@correo.com', password: 'secret1' })]);
  });

  it('rejects a duplicate email ignoring case', async () => {
    await service.register({ name: 'Ana Pérez', email: 'ana@correo.com', password: 'secret1' });
    const result = await service.register({ name: 'Otra Persona', email: 'ANA@CORREO.COM', password: 'secret2' });
    expect(result).toEqual({ ok: false, reason: 'duplicate-email' });
  });
});
