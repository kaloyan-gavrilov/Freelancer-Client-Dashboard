import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsInt, Min } from 'class-validator';

export class CreateBidDto {
  @ApiProperty({ example: 75.5, description: 'Proposed rate for the project' })
  @IsNumber()
  @IsPositive()
  proposedRate: number;

  @ApiProperty({ example: 30, description: 'Estimated duration in days' })
  @IsInt()
  @Min(1)
  estimatedDurationDays: number;

  @ApiProperty({ example: 'I have 5 years of experience building e-commerce platforms...' })
  @IsString()
  @IsNotEmpty()
  coverLetter: string;
}
