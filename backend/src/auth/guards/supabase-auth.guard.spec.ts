import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { SupabaseClientService } from '../../infrastructure/supabase/supabase.client';
import { UserRole } from '../../domain/user/user-role.enum';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMockContext(headers: Record<string, string> = {}): ExecutionContext {
  const request = { headers, user: undefined as unknown };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SupabaseAuthGuard', () => {
  let guard: SupabaseAuthGuard;

  // Mocked Supabase chained builder: from('users').select().eq().single()
  const mockSingle = jest.fn();
  const mockEq = jest.fn(() => ({ single: mockSingle }));
  const mockSelect = jest.fn(() => ({ eq: mockEq }));
  const mockFrom = jest.fn(() => ({ select: mockSelect }));
  const mockGetUser = jest.fn();

  const mockSupabaseClientService = {
    client: {
      auth: { getUser: mockGetUser },
      from: mockFrom,
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseAuthGuard,
        { provide: SupabaseClientService, useValue: mockSupabaseClientService },
      ],
    }).compile();

    guard = module.get<SupabaseAuthGuard>(SupabaseAuthGuard);
  });

  // -------------------------------------------------------------------------
  // 401 — Missing token
  // -------------------------------------------------------------------------

  it('throws 401 when Authorization header is absent', async () => {
    const ctx = buildMockContext({});
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('throws 401 when Authorization header has no Bearer prefix', async () => {
    const ctx = buildMockContext({ authorization: 'Basic dXNlcjpwYXNz' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 401 — Invalid / expired token
  // -------------------------------------------------------------------------

  it('throws 401 when supabase.auth.getUser returns an error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' },
    });

    const ctx = buildMockContext({ authorization: 'Bearer invalid.jwt.token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
    expect(mockGetUser).toHaveBeenCalledWith('invalid.jwt.token');
  });

  it('throws 401 when supabase.auth.getUser returns null user without error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const ctx = buildMockContext({ authorization: 'Bearer token' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  // -------------------------------------------------------------------------
  // 401 — User profile not found in application DB
  // -------------------------------------------------------------------------

  it('throws 401 when the application users table has no record for the auth user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-uuid-123' } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: { message: 'No rows found' } });

    const ctx = buildMockContext({ authorization: 'Bearer valid.jwt' });
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  // -------------------------------------------------------------------------
  // 200 — Happy path
  // -------------------------------------------------------------------------

  it('attaches AuthenticatedUser to request and returns true on valid token', async () => {
    const authUserId = 'auth-uuid-456';
    mockGetUser.mockResolvedValue({
      data: { user: { id: authUserId } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { id: authUserId, email: 'alice@example.com', role: 'CLIENT' },
      error: null,
    });

    const request = { headers: { authorization: 'Bearer valid.jwt.token' }, user: undefined as unknown };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(request.user).toEqual({
      id: authUserId,
      email: 'alice@example.com',
      role: UserRole.CLIENT,
    });

    // Verify the DB query was built correctly
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockSelect).toHaveBeenCalledWith('id, email, role');
    expect(mockEq).toHaveBeenCalledWith('id', authUserId);
  });

  it('correctly maps FREELANCER role from DB to UserRole enum', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'freelancer-id' } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { id: 'freelancer-id', email: 'bob@example.com', role: 'FREELANCER' },
      error: null,
    });

    const request = { headers: { authorization: 'Bearer token' }, user: undefined as unknown };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await guard.canActivate(ctx);

    expect((request.user as { role: UserRole }).role).toBe(UserRole.FREELANCER);
  });

  // -------------------------------------------------------------------------
  // SRP — guard never checks roles
  // -------------------------------------------------------------------------

  it('does not inspect or enforce roles — only attaches user to request', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'admin-id' } },
      error: null,
    });
    mockSingle.mockResolvedValue({
      data: { id: 'admin-id', email: 'admin@example.com', role: 'ADMIN' },
      error: null,
    });

    const request = { headers: { authorization: 'Bearer token' }, user: undefined as unknown };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    // Guard should return true regardless of the role value
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });
});
