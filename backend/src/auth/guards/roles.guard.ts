import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../domain/user/user-role.enum';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * RolesGuard — Single Responsibility: Role-Based Authorization only.
 *
 * Design Pattern: Decorator Pattern (NestJS guard applied as a decorator on
 * route handlers or controllers to add authorisation behaviour non-invasively).
 *
 * SRP: This guard only reads @Roles() metadata and compares the authenticated
 * user's role against the required roles. It never re-validates the JWT —
 * that is the exclusive responsibility of SupabaseAuthGuard.
 *
 * Execution order: RolesGuard MUST run AFTER SupabaseAuthGuard so that
 * request.user is already populated. This ordering is enforced by the sequence
 * of APP_GUARD registrations in AppModule.
 *
 * @throws ForbiddenException (403) when the authenticated user's role is not
 *   included in the set of roles declared via @Roles() on the route handler.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator — route is accessible to any authenticated user.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user: AuthenticatedUser }>();

    const { role } = request.user;

    if (!requiredRoles.includes(role)) {
      throw new ForbiddenException(
        `Role '${role}' is not permitted. Required: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
