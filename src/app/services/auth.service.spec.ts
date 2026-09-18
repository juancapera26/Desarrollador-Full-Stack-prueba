/// <reference types="jasmine" />

import { TestBed } from "@angular/core/testing";
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { AuthService } from "./auth.service";

let emulatorConnected = false;

async function clearUsersCollection(): Promise<void> {
  const snapshot = await getDocs(collection(db, "users"));
  await Promise.all(
    snapshot.docs.map((docSnapshot) => deleteDoc(docSnapshot.ref)),
  );
}

describe("AuthService registration", () => {
  let service: AuthService;

  beforeAll(() => {
    if (!emulatorConnected) {
      connectFirestoreEmulator(db, "127.0.0.1", 8085);
      emulatorConnected = true;
    }
  });

  beforeEach(async () => {
    await clearUsersCollection();
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it("stores a newly registered user", async () => {
    const result = await service.register({
      name: "Ana Pérez",
      email: "ANA@correo.com",
      password: "secret1",
    });
    expect(result.ok).toBeTrue();

    const snapshot = await getDocs(collection(db, "users"));
    const users = snapshot.docs.map((docSnapshot) => docSnapshot.data());
    expect(users).toEqual([
      jasmine.objectContaining({
        name: "Ana Pérez",
        email: "ana@correo.com",
        password: "secret1",
      }),
    ]);
  });

  it("rejects a duplicate email ignoring case", async () => {
    await service.register({
      name: "Ana Pérez",
      email: "ana@correo.com",
      password: "secret1",
    });
    const result = await service.register({
      name: "Otra Persona",
      email: "ANA@CORREO.COM",
      password: "secret2",
    });
    expect(result).toEqual({ ok: false, reason: "duplicate-email" });
  });
});

describe("AuthService login/session", () => {
  let service: AuthService;

  beforeAll(() => {
    if (!emulatorConnected) {
      connectFirestoreEmulator(db, "127.0.0.1", 8085);
      emulatorConnected = true;
    }
  });

  beforeEach(async () => {
    await clearUsersCollection();
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    await service.register({
      name: "Ana Pérez",
      email: "ana@correo.com",
      password: "secret1",
    });
  });

  it("logs in with correct credentials, ignoring email case, and persists the session", async () => {
    const result = await service.login("ANA@correo.com", "secret1");
    expect(result).toEqual({
      ok: true,
      user: jasmine.objectContaining({
        name: "Ana Pérez",
        email: "ana@correo.com",
      }),
    });
    expect(service.isAuthenticated()).toBeTrue();
    expect(service.getCurrentUser()).toEqual(
      jasmine.objectContaining({ email: "ana@correo.com" }),
    );
  });

  it("rejects an incorrect password without creating a session", async () => {
    const result = await service.login("ana@correo.com", "wrong-password");
    expect(result).toEqual({ ok: false, reason: "invalid-credentials" });
    expect(service.isAuthenticated()).toBeFalse();
  });

  it("rejects a nonexistent user without creating a session", async () => {
    const result = await service.login("nadie@correo.com", "secret1");
    expect(result).toEqual({ ok: false, reason: "invalid-credentials" });
    expect(service.isAuthenticated()).toBeFalse();
  });

  it("clears the session on logout, and a fresh read still sees it as logged out (simulates reload)", async () => {
    await service.login("ana@correo.com", "secret1");
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
  });

  it("keeps the session across a new service instance, simulating a page reload", async () => {
    await service.login("ana@correo.com", "secret1");

    const reloadedService = TestBed.inject(AuthService);
    expect(reloadedService.isAuthenticated()).toBeTrue();
    expect(reloadedService.getCurrentUser()).toEqual(
      jasmine.objectContaining({ email: "ana@correo.com" }),
    );
  });

  it("recovers safely when the session data stored is corrupted", () => {
    localStorage.setItem("currentUser", "{invalid-json");
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.getCurrentUser()).toBeNull();
  });
});
