import { IncomingMessage } from 'node:http';
import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
export async function readAdminJson(
  request: IncomingMessage,
): Promise<Record<string, unknown>> {
  if (!request.headers['content-type']?.startsWith('application/json'))
    throw new BadRequestException('请使用 JSON 请求');
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > 4096) throw new PayloadTooLargeException('请求内容过大');
    chunks.push(bytes);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || Array.isArray(value) || typeof value !== 'object')
      throw new Error();
    return value;
  } catch {
    throw new BadRequestException('请求格式不正确');
  }
}
