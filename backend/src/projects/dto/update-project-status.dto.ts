import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

const PROJECT_STATUSES = [
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'REVIEW',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
] as const;

export class UpdateProjectStatusDto {
  @ApiProperty({
    enum: PROJECT_STATUSES,
    example: 'OPEN',
    description: 'Target status for the project state transition',
  })
  @IsEnum(PROJECT_STATUSES)
  status: typeof PROJECT_STATUSES[number];
}
