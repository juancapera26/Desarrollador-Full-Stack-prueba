import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService registration', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('stores a newly registered user', () => {
    const result = service.register({ name: 'Ana Pérez', email: 'ANA@correo.com', password: 'secret1' });
    expect(result.ok).toBeTrue();
    expect(JSON.parse(localStorage.getItem('users') ?? '[]')).toEqual([jasmine.objectContaining({ name: 'Ana Pérez', email: 'ana@correo.com', password: 'secret1' })]);
  });

  it('rejects a duplicate email ignoring case', () => {
    service.register({ name: 'Ana Pérez', email: 'ana@correo.com', password: 'secret1' });
    const result = service.register({ name: 'Otra Persona', email: 'ANA@CORREO.COM', password: 'secret2' });
    expect(result).toEqual({ ok: false, reason: 'duplicate-email' });
  });

  it('recovers with an empty list when stored data is invalid', () => {
    localStorage.setItem('users', '{invalid');
    expect(service.register({ name: 'Luis', email: 'luis@correo.com', password: 'secret1' }).ok).toBeTrue();
  });
});
