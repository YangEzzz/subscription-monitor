import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class HistoryQueryDto {
  @ApiPropertyOptional({ example: '2026-10' })
  @IsOptional()
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/)
  month?: string;

  @ApiPropertyOptional({ example: 'CNY' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  currency?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  page?: number;
}
