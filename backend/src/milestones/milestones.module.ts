import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { SupabaseClientService } from '../infrastructure/supabase/supabase.client';
import { SupabaseFileRepository } from '../infrastructure/repositories/supabase-file.repository';
import { FILE_REPOSITORY } from '../domain/repositories/file.repository.interface';
import { FileUploadService } from './file-upload.service';
import { MilestonesController } from './milestones.controller';

/**
 * MilestonesModule wires up file upload infrastructure:
 *  - MulterModule with in-memory storage (no temp files written to disk)
 *  - SupabaseFileRepository bound to FILE_REPOSITORY token
 *  - FileUploadService
 *  - MilestonesController exposing the two HTTP routes
 */
@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [MilestonesController],
  providers: [
    SupabaseClientService,
    FileUploadService,
    { provide: FILE_REPOSITORY, useClass: SupabaseFileRepository },
  ],
})
export class MilestonesModule {}
