import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsDateString } from 'class-validator';

export class CreateTimeEntryDto {
  @ApiProperty({ example: 4.5, description: 'Hours worked' })
  @IsNumber()
  @IsPositive()
  hours: number;

  @ApiProperty({ example: 'Implemented user authentication flow' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2026-02-23T00:00:00.000Z', description: 'Date the work was performed' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'milestone-uuid', description: 'Associated milestone ID' })
  @IsOptional()
  @IsString()
  milestoneId?: string;
}
