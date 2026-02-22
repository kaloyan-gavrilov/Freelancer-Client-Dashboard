import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/guards/supabase-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { MilestonesModule } from './milestones/milestones.module';

/**
 * Guards are registered in the order they must execute:
 *  1. SupabaseAuthGuard — validates the JWT and populates request.user (401 on failure)
 *  2. RolesGuard       — checks request.user.role against @Roles() metadata (403 on failure)
 */
@Module({
  imports: [AuthModule, MilestonesModule],
  providers: [
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
