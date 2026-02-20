import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SupabaseClientService } from '../../infrastructure/supabase/supabase.client';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UserRole } from '../../domain/user/user-role.enum';

/**
 * SupabaseAuthGuard — Single Responsibility: JWT Authentication only.
 *
 * Design Pattern: Decorator Pattern (NestJS guard applied as a decorator on
 * route handlers or controllers to add authentication behaviour non-invasively).
 *
 * SRP: This guard only validates the incoming Bearer token via Supabase and
 * attaches the resolved user to the request. It never inspects or enforces
 * roles — that is the exclusive responsibility of RolesGuard.
 *
 * Flow:
 *  1. Extract the Bearer token from the Authorization header.
 *  2. Call supabase.auth.getUser(token) to validate the JWT.
 *  3. Fetch the user's application profile (id, email, role) from the DB.
 *  4. Attach the AuthenticatedUser object to request.user.
 *
 * @throws UnauthorizedException (401) when the token is absent, malformed,
 *   expired, or when no matching application user record exists.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseClientService: SupabaseClientService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const { data: authData, error: authError } =
      await this.supabaseClientService.client.auth.getUser(token);

    if (authError || !authData.user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const { data: dbUser, error: dbError } = await this.supabaseClientService.client
      .from('users')
      .select('id, email, role')
      .eq('id', authData.user.id)
      .single();

    if (dbError || !dbUser) {
      throw new UnauthorizedException('User profile not found');
    }

    const authenticatedUser: AuthenticatedUser = {
      id: (dbUser as { id: string; email: string; role: string }).id,
      email: (dbUser as { id: string; email: string; role: string }).email,
      role: (dbUser as { id: string; email: string; role: string }).role as UserRole,
    };

    (request as Request & { user: AuthenticatedUser }).user = authenticatedUser;

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7);
  }
}
