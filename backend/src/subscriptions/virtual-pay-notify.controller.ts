import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../auth/auth.decorators';
import { MembershipPaymentsService } from './membership-payments.service';
import { VirtualPayService } from './virtual-pay.service';

@Controller({ path: 'membership/virtual', version: '1' })
export class VirtualPayNotifyController {
  constructor(
    private readonly payments: MembershipPaymentsService,
    private readonly gateway: VirtualPayService,
  ) {}
  private query(request: Request): Record<string, string> {
    const query: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.query)) {
      if (typeof value !== 'string')
        throw new BadRequestException('推送参数格式不正确');
      query[key] = value;
    }
    return query;
  }
  @Public()
  @Get('notify')
  challenge(@Req() request: Request, @Res() response: Response) {
    response
      .type('text/plain')
      .send(this.gateway.challenge(this.query(request)));
  }
  @Public()
  @Post('notify')
  @HttpCode(200)
  async notify(
    @Req() request: RawBodyRequest<Request>,
    @Res() response: Response,
  ) {
    const raw =
      request.rawBody?.toString('utf8') ??
      (typeof request.body === 'string' ? request.body : undefined);
    if (!raw) throw new BadRequestException('缺少支付推送原始报文');
    const result = await this.payments.notify(this.query(request), raw);
    if (typeof result === 'string')
      response.type('application/xml').send(result);
    else response.json(result);
  }
}
