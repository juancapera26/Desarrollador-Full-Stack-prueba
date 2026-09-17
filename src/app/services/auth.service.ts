import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

export type RegistrationResult =
  | { ok: true; user: User }
  | { ok: false; reason: 'duplicate-email' };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usersKey = 'users';

  register(input: Omit<User, 'id'>): RegistrationResult {
    const users = this.readUsers();
    const normalizedEmail = input.email.trim().toLowerCase();

    if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      return { ok: false, reason: 'duplicate-email' };
    }

    const user: User = { ...input, email: normalizedEmail, id: crypto.randomUUID() };
    this.writeUsers([...users, user]);
    return { ok: true, user };
  }

  private readUsers(): User[] {
    try {
      const stored = localStorage.getItem(this.usersKey);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as User[]) : [];
    } catch {
      return [];
    }
  }

  private writeUsers(users: User[]): void {
    localStorage.setItem(this.usersKey, JSON.stringify(users));
  }
}
