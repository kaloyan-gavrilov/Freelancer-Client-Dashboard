import { Module } from '@nestjs/common';
import { SupabaseClientService } from '../infrastructure/supabase/supabase.client';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * AuthModule wires together the two guards that implement the
 * authentication/authorisation pipeline.
 *
 * Guards are exported so AppModule can register them as global APP_GUARD
 * providers, ensuring consistent application across all routes.
 */
@Module({
  providers: [SupabaseClientService, SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseClientService, SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}
