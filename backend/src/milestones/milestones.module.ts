import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RepositoriesModule } from '../infrastructure/repositories/repositories.module';
import { SupabaseClientService } from '../infrastructure/supabase/supabase.client';
import { SupabaseFileRepository } from '../infrastructure/repositories/supabase-file.repository';
import { FILE_REPOSITORY } from '../domain/repositories/file.repository.interface';
import { FileUploadService } from './file-upload.service';
import { MilestonesService } from './milestones.service';
import { MilestonesController } from './milestones.controller';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
    RepositoriesModule,
  ],
  controllers: [MilestonesController],
  providers: [
    SupabaseClientService,
    FileUploadService,
    MilestonesService,
    { provide: FILE_REPOSITORY, useClass: SupabaseFileRepository },
  ],
})
export class MilestonesModule {}
