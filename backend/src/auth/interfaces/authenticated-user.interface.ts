import { UserRole } from '../../domain/user/user-role.enum';

/**
 * Shape of the user object attached to the Express request after
 * SupabaseAuthGuard has successfully validated the JWT.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
