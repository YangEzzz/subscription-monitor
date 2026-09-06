import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  amountVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notificationEnabled?: boolean;

  @ApiPropertyOptional({ example: ['system'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  notificationAuthorization?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  weeklySummary?: boolean;

  @ApiPropertyOptional({ example: 'CNY' })
  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @ApiPropertyOptional({ example: [7, 3, 1], type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(30, { each: true })
  defaultReminders?: number[];

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  reminderTime?: string;

  @ApiPropertyOptional({ example: 'Asia/Shanghai' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
