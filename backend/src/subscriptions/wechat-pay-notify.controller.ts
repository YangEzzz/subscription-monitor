import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../auth/auth.decorators';
import { MembershipPaymentsService } from './membership-payments.service';

@Controller({ path: 'membership/wechat', version: '1' })
export class WechatPayNotifyController {
  constructor(private readonly payments: MembershipPaymentsService) {}

  @Public()
  @Post('notify')
  @HttpCode(204)
  async notify(@Req() request: RawBodyRequest<Request>) {
    if (!request.rawBody) throw new BadRequestException('缺少支付通知原始报文');
    const headers = new Headers();
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') headers.set(key, value);
    }
    await this.payments.notify(headers, request.rawBody);
  }
}
