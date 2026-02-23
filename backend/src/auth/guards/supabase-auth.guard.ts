import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SupabaseClientService } from '../../infrastructure/supabase/supabase.client';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { UserRole } from '../../domain/user/user-role.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseClientService: SupabaseClientService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

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
