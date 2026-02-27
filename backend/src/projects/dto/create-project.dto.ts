import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  IsEnum,
  IsOptional,
  IsArray,
  Min,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'E-commerce Website Redesign' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Full redesign of the online store with modern UI' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1000, minimum: 0 })
  @IsNumber()
  @Min(0)
  budgetMin: number;

  @ApiProperty({ example: 5000, minimum: 0 })
  @IsNumber()
  @Min(0)
  budgetMax: number;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @IsDateString()
  deadline: string;

  @ApiProperty({ enum: ['FIXED', 'HOURLY'], example: 'FIXED' })
  @IsEnum(['FIXED', 'HOURLY'] as const)
  projectType: 'FIXED' | 'HOURLY';

  @ApiPropertyOptional({ example: ['React', 'Node.js'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ enum: ['DRAFT', 'OPEN'], default: 'DRAFT' })
  @IsOptional()
  @IsEnum(['DRAFT', 'OPEN'] as const)
  initialStatus?: 'DRAFT' | 'OPEN';
}
