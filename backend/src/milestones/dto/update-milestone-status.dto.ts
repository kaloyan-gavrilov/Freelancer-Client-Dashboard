import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

const MILESTONE_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;

export class UpdateMilestoneStatusDto {
  @ApiProperty({
    enum: MILESTONE_STATUSES,
    example: 'IN_PROGRESS',
    description: 'New status for the milestone',
  })
  @IsEnum(MILESTONE_STATUSES)
  status: typeof MILESTONE_STATUSES[number];
}
