import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, Min } from 'class-validator';

export class CreateMilestoneDto {
  @ApiProperty({ example: 'Design Phase' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Complete wireframes and mockups' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2500, description: 'Amount allocated to this milestone' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 0, description: 'Display order of the milestone (0-based)' })
  @IsNumber()
  @Min(0)
  order: number;
}
