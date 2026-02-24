import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ProjectQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ example: 'React,Node.js', description: 'Comma-separated skill filter' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ example: 1000, description: 'Minimum budget filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Maximum budget filter' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ enum: ['DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED', 'DISPUTED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED', 'DISPUTED'] as const)
  status?: string;

  @ApiPropertyOptional({ example: 'uuid-of-freelancer', description: 'Filter projects assigned to a specific freelancer' })
  @IsOptional()
  @IsString()
  freelancerId?: string;
}
