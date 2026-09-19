import { Injectable } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { SessionUser } from '../models/session-user.model';
import { User } from '../models/user.model';

export type RegistrationResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'duplicate-email' | 'weak-password' | 'invalid-email' }
  | { ok: false; reason: 'unknown-error' };

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: 'invalid-credentials' }
  | { ok: false; reason: 'unknown-error' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser: SessionUser | null = null;
  private readonly readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        this.currentUser = firebaseUser ? this.toSessionUser(firebaseUser) : null;
        resolve();
      });
    });
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  async register(input: { name: string; email: string; password: string }): Promise<RegistrationResult> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, input.password);
      await updateProfile(credential.user, { displayName: name });
      const user: User = { id: credential.user.uid, name, email };
      await setDoc(doc(db, 'users', user.id), user);
      this.currentUser = this.toSessionUser(credential.user, name);
      return { ok: true, user };
    } catch (error) {
      const code = this.firebaseErrorCode(error);
      if (code === 'auth/email-already-in-use') return { ok: false, reason: 'duplicate-email' };
      if (code === 'auth/weak-password') return { ok: false, reason: 'weak-password' };
      if (code === 'auth/invalid-email') return { ok: false, reason: 'invalid-email' };
      console.error('[AuthService] No se pudo registrar el usuario.', error);
      return { ok: false, reason: 'unknown-error' };
    }
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const sessionUser = this.toSessionUser(credential.user);
      this.currentUser = sessionUser;
      return { ok: true, user: sessionUser };
    } catch (error) {
      const code = this.firebaseErrorCode(error);
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(code)) {
        return { ok: false, reason: 'invalid-credentials' };
      }
      console.error('[AuthService] No se pudo iniciar sesión.', error);
      return { ok: false, reason: 'unknown-error' };
    }
  }

  async logout(): Promise<void> {
    await signOut(auth);
    this.currentUser = null;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getCurrentUser(): SessionUser | null {
    return this.currentUser;
  }

  private toSessionUser(firebaseUser: FirebaseUser, name = firebaseUser.displayName ?? 'Cliente'): SessionUser {
    return { id: firebaseUser.uid, name, email: firebaseUser.email ?? '' };
  }

  private firebaseErrorCode(error: unknown): string {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';
  }
}
