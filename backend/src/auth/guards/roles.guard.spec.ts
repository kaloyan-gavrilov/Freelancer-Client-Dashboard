import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../domain/user/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMockContext(user: AuthenticatedUser): ExecutionContext {
  const request = { user };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  // -------------------------------------------------------------------------
  // No @Roles() decorator — open to all authenticated users
  // -------------------------------------------------------------------------

  it('returns true when no @Roles() decorator is present (undefined)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const user: AuthenticatedUser = { id: '1', email: 'u@test.com', role: UserRole.FREELANCER };
    const ctx = buildMockContext(user);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when @Roles() is set to an empty array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    const user: AuthenticatedUser = { id: '1', email: 'u@test.com', role: UserRole.CLIENT };
    const ctx = buildMockContext(user);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 403 — Role not in allowed list
  // -------------------------------------------------------------------------

  it('throws 403 when user role is not in the required roles list', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    const user: AuthenticatedUser = { id: '2', email: 'f@test.com', role: UserRole.FREELANCER };
    const ctx = buildMockContext(user);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws 403 when CLIENT tries to access an ADMIN-only route', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    const user: AuthenticatedUser = { id: '3', email: 'c@test.com', role: UserRole.CLIENT };
    const ctx = buildMockContext(user);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws 403 when FREELANCER tries to access a CLIENT-only route', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CLIENT]);

    const user: AuthenticatedUser = { id: '4', email: 'f@test.com', role: UserRole.FREELANCER };
    const ctx = buildMockContext(user);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  // -------------------------------------------------------------------------
  // 200 — Role in allowed list
  // -------------------------------------------------------------------------

  it('returns true when user role matches the single required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CLIENT]);

    const user: AuthenticatedUser = { id: '5', email: 'c@test.com', role: UserRole.CLIENT };
    const ctx = buildMockContext(user);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true when user role is one of multiple allowed roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CLIENT, UserRole.FREELANCER]);

    const user: AuthenticatedUser = { id: '6', email: 'f@test.com', role: UserRole.FREELANCER };
    const ctx = buildMockContext(user);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('returns true for ADMIN when ADMIN is the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    const user: AuthenticatedUser = { id: '7', email: 'a@test.com', role: UserRole.ADMIN };
    const ctx = buildMockContext(user);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Reflector usage — reads from both handler and class
  // -------------------------------------------------------------------------

  it('calls reflector.getAllAndOverride with ROLES_KEY and handler+class targets', () => {
    const handler = {};
    const cls = {};
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: '8', email: 'x@x.com', role: UserRole.CLIENT } }) }),
      getHandler: () => handler,
      getClass: () => cls,
    } as unknown as ExecutionContext;

    reflector.getAllAndOverride.mockReturnValue([UserRole.CLIENT]);

    guard.canActivate(ctx);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [handler, cls]);
  });

  // -------------------------------------------------------------------------
  // SRP — guard never calls auth service or validates token
  // -------------------------------------------------------------------------

  it('does not perform any JWT validation — only role checking', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.FREELANCER]);

    const user: AuthenticatedUser = { id: '9', email: 'f@test.com', role: UserRole.FREELANCER };
    const ctx = buildMockContext(user);

    // If guard tried to call supabase it would throw because no supabase service is provided
    expect(() => guard.canActivate(ctx)).not.toThrow();
  });
});
