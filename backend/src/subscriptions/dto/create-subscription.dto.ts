import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  BILLING_CYCLES,
  PAYMENT_METHODS,
  SUBSCRIPTION_CATEGORIES,
  BillingCycle,
  PaymentMethod,
  SubscriptionCategory,
} from '../domain/subscription';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'Netflix Premium' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({ example: 'Premium' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  plan?: string;

  @ApiPropertyOptional({ example: 'N' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  logo?: string;

  @ApiPropertyOptional({ example: '#e50914', default: '#16834d' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;

  @ApiPropertyOptional({ example: 108, nullable: true, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number | null;

  @ApiPropertyOptional({ example: 'CNY', default: 'CNY' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiProperty({ enum: BILLING_CYCLES, example: 'monthly' })
  @IsEnum(BILLING_CYCLES)
  cycle: BillingCycle;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  cycleValue?: number;

  @ApiProperty({ example: '2026-10-12' })
  @IsDateString()
  nextBillingDate: string;

  @ApiPropertyOptional({ example: 'card', enum: PAYMENT_METHODS })
  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  payment?: PaymentMethod;

  @ApiProperty({ example: 'video', enum: SUBSCRIPTION_CATEGORIES })
  @IsIn(SUBSCRIPTION_CATEGORIES)
  category: SubscriptionCategory;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: [7, 3, 1], maxItems: 5, type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(30, { each: true })
  reminders?: number[];

  @ApiPropertyOptional({ example: '2026-09-30', nullable: true, type: String })
  @IsOptional()
  @IsDateString()
  trialEndDate?: string | null;

  @ApiPropertyOptional({ example: '家庭账号' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ example: 'Account > Billing > Cancel plan' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cancelGuide?: string;
}
