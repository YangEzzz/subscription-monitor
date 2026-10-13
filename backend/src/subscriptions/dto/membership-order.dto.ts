import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

export class CreateMembershipOrderDto {
  @ApiProperty({ example: 'lifetime' })
  @IsIn(['lifetime'])
  productId: string;

  @ApiProperty({
    description: 'Stable idempotency key for this purchase attempt',
  })
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{16,80}$/)
  requestId: string;
}

export class SimulateMembershipPaymentDto {
  @ApiProperty({ enum: ['success', 'cancel', 'failure'] })
  @IsIn(['success', 'cancel', 'failure'])
  outcome: 'success' | 'cancel' | 'failure';
}
