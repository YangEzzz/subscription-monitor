import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DISPLAY_STATUSES,
  SUBSCRIPTION_CATEGORIES,
} from '../domain/subscription';

const LIST_STATUSES = ['all', ...DISPLAY_STATUSES] as const;

function toBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return undefined;
  return value === true || value === 'true';
}

export class QuerySubscriptionDto {
  @ApiPropertyOptional({ example: 'cloud' })
  @IsOptional()
  @IsIn(SUBSCRIPTION_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ example: 'netflix' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ enum: LIST_STATUSES, default: 'all' })
  @IsOptional()
  @IsIn(LIST_STATUSES)
  status?: (typeof LIST_STATUSES)[number];

  @ApiPropertyOptional({ enum: ['date', 'amount', 'created'], default: 'date' })
  @IsOptional()
  @IsIn(['date', 'amount', 'created'])
  sort?: 'date' | 'amount' | 'created';

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  includeDeleted?: boolean;
}
