/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/checkout' } as RouterStateSnapshot;

  it('allows an authenticated user to continue to checkout', () => {
    const authService = { isAuthenticated: () => true };
    const router = { createUrlTree: jasmine.createSpy('createUrlTree') };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBeTrue();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects an unauthenticated user to login without changing the cart', () => {
    const loginTree = {} as UrlTree;
    const authService = { isAuthenticated: () => false };
    const router = { createUrlTree: jasmine.createSpy('createUrlTree').and.returnValue(loginTree) };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(loginTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/checkout' } });
  });
});
