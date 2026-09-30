import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './auth.decorators';

export class WechatLoginDto {
  @ApiProperty({
    description: 'Temporary code returned by uni.login / wx.login',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  @Matches(/^\S+$/)
  code: string;
}

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('wechat')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Exchange a WeChat login code for an application session',
  })
  login(@Body() body: WechatLoginDto) {
    return this.auth.login(body.code);
  }
}
