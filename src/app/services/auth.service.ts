import { Injectable } from '@angular/core';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase.config';
import { SessionUser } from '../models/session-user.model';
import { User } from '../models/user.model';

export type RegistrationResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'duplicate-email' }
  | { ok: false; reason: 'unknown-error' };

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: 'invalid-credentials' }
  | { ok: false; reason: 'unknown-error' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersCollection = collection(db, 'users');
  private readonly sessionKey = 'currentUser';

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

  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const matchQuery = query(this.usersCollection, where('email', '==', normalizedEmail));
      const snapshot = await getDocs(matchQuery);
      if (snapshot.empty) {
        return { ok: false, reason: 'invalid-credentials' };
      }

      const storedUser = snapshot.docs[0].data() as User;
      if (storedUser.password !== password) {
        return { ok: false, reason: 'invalid-credentials' };
      }

      const sessionUser: SessionUser = { id: storedUser.id, name: storedUser.name, email: storedUser.email };
      this.writeSession(sessionUser);
      return { ok: true, user: sessionUser };
    } catch {
      return { ok: false, reason: 'unknown-error' };
    }
  }

  logout(): void {
    localStorage.removeItem(this.sessionKey);
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  getCurrentUser(): SessionUser | null {
    try {
      const stored = localStorage.getItem(this.sessionKey);
      if (!stored) return null;
      const parsed: unknown = JSON.parse(stored);
      const isValidSession =
        typeof parsed === 'object' &&
        parsed !== null &&
        typeof (parsed as SessionUser).id === 'string' &&
        typeof (parsed as SessionUser).email === 'string' &&
        typeof (parsed as SessionUser).name === 'string';
      return isValidSession ? (parsed as SessionUser) : null;
    } catch {
      return null;
    }
  }

  private writeSession(user: SessionUser): void {
    localStorage.setItem(this.sessionKey, JSON.stringify(user));
  }
}
