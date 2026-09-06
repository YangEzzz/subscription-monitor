import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateSubscriptionDto } from './create-subscription.dto';
import {
  SUBSCRIPTION_STATUSES,
  SubscriptionStatus,
} from '../domain/subscription';

export class UpdateSubscriptionDto extends PartialType(CreateSubscriptionDto) {
  @ApiPropertyOptional({ enum: SUBSCRIPTION_STATUSES })
  @IsOptional()
  @IsEnum(SUBSCRIPTION_STATUSES)
  status?: SubscriptionStatus;
}
