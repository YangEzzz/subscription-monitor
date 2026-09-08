import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, Matches } from 'class-validator';

export class RenewSubscriptionDto {
  @ApiPropertyOptional({ example: '2026-10-31', description: 'The billing period being confirmed; retries of this period are idempotent' })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  billingDate?: string;
}
