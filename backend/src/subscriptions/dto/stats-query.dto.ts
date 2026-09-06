import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class StatsQueryDto {
  @ApiPropertyOptional({
    enum: ['month', 'year', 'next30'],
    default: 'month',
  })
  @IsOptional()
  @IsIn(['month', 'year', 'next30'])
  period?: 'month' | 'year' | 'next30';

  @ApiPropertyOptional({ example: 'CNY', default: 'CNY' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
