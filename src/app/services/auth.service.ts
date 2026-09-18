import { Injectable } from '@angular/core';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase.config';
import { User } from '../models/user.model';

export type RegistrationResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'duplicate-email' }
  | { ok: false; reason: 'unknown-error' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersCollection = collection(db, 'users');

  async register(input: Omit<User, 'id'>): Promise<RegistrationResult> {
    const normalizedEmail = input.email.trim().toLowerCase();

    try {
      const duplicateQuery = query(this.usersCollection, where('email', '==', normalizedEmail));
      const duplicateSnapshot = await getDocs(duplicateQuery);
      if (!duplicateSnapshot.empty) {
        return { ok: false, reason: 'duplicate-email' };
      }

      const id = crypto.randomUUID();
      const user: User = { ...input, email: normalizedEmail, id };
      await setDoc(doc(this.usersCollection, id), user);
      return { ok: true, user };
    } catch {
      return { ok: false, reason: 'unknown-error' };
    }
  }
}
