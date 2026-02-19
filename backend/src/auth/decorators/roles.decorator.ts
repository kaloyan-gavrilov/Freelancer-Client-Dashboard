import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/user/user-role.enum';

/**
 * Metadata key used by RolesGuard to read the allowed roles from a route handler.
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles(...roles) — Custom parameter decorator (Decorator Pattern).
 *
 * Attaches role metadata to a route handler or controller class.
 * RolesGuard reads this metadata to decide whether the authenticated
 * user is permitted to call the endpoint.
 *
 * @example
 * @Roles(UserRole.ADMIN)
 * @Delete(':id')
 * remove(@Param('id') id: string) { ... }
 *
 * @example
 * @Roles(UserRole.CLIENT, UserRole.FREELANCER)
 * @Get('projects')
 * findAll() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
