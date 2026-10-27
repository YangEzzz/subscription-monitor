import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  SUBSCRIPTIONS_REPOSITORY,
  SubscriptionsRepository,
} from '../subscriptions/repositories/subscriptions.repository';

@Injectable()
export class AdminMembershipsService {
  constructor(
    @Inject(SUBSCRIPTIONS_REPOSITORY)
    private readonly repository: SubscriptionsRepository,
  ) {}

  async inspect(userId: string) {
    await this.repository.findUserTestFlag(userId); // Existing accounts only.
    return {
      membership: await this.repository.findMembership(userId),
      grant: await this.repository.findAdminMembershipGrant(userId),
      revocation: await this.repository.findAdminMembershipGrant(
        userId,
        'revoke',
      ),
      canGrant: process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED !== 'false',
      canRevoke: process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED !== 'false',
    };
  }

  async grant(
    userId: string,
    input: Record<string, unknown>,
    operator: string,
  ) {
    if (process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED === 'false')
      throw new ForbiddenException(
        '当前环境未开放会员赠送，请在可写后台处理。',
      );
    if (
      typeof input.note !== 'string' ||
      input.note.trim().length < 2 ||
      input.note.trim().length > 200
    )
      throw new BadRequestException('请填写 2–200 字的赠送原因。');
    const note = input.note.trim();
    await this.repository.transactionForUser(userId, async (repo) => {
      await repo.findUserTestFlag(userId);
      const current = await repo.findMembership(userId);
      // Repeated submissions are safe and never replace paid/legacy rights.
      if (
        current?.status === 'active' &&
        current.plan === 'member' &&
        current.source !== 'simulation'
      )
        return;
      const createdAt = new Date().toISOString();
      await repo.saveMembership({
        userId,
        status: 'active',
        plan: 'member',
        source: 'admin',
        sourceOrderId: null,
        startedAt: createdAt,
      });
      await repo.recordAdminMembershipGrant({
        action: 'grant',
        previousMembership: current,
        id: randomUUID(),
        userId,
        note,
        operator,
        createdAt,
      });
    });
    return this.inspect(userId);
  }

  async revoke(
    userId: string,
    input: Record<string, unknown>,
    operator: string,
  ) {
    if (process.env.ADMIN_MEMBERSHIP_GRANTS_ENABLED === 'false')
      throw new ForbiddenException(
        '当前环境未开放会员管理，请在可写后台处理。',
      );
    if (
      typeof input.note !== 'string' ||
      input.note.trim().length < 2 ||
      input.note.trim().length > 200
    )
      throw new BadRequestException('请填写 2–200 字的取消原因。');
    const expected = input.expectedMembership;
    if (!expected || typeof expected !== 'object' || Array.isArray(expected))
      throw new BadRequestException('请先刷新会员状态再确认取消。');
    await this.repository.transactionForUser(userId, async (repo) => {
      await repo.findUserTestFlag(userId);
      const current = await repo.findMembership(userId);
      if (!current || current.status !== 'active') return;
      const snapshot = expected as Record<string, unknown>;
      if (
        ['status', 'plan', 'source', 'sourceOrderId', 'startedAt'].some(
          (key) =>
            (current[key as keyof typeof current] ?? null) !==
            (snapshot[key] ?? null),
        )
      )
        throw new ConflictException(
          '会员状态已变化，请刷新后重新核对，尚未取消。',
        );
      await repo.saveMembership({
        userId,
        status: 'free',
        plan: 'free',
        startedAt: null,
        source: 'admin_revoked',
        sourceOrderId: current.sourceOrderId ?? null,
      });
      await repo.recordAdminMembershipGrant({
        id: randomUUID(),
        userId,
        action: 'revoke',
        previousMembership: current,
        note: (input.note as string).trim(),
        operator,
        createdAt: new Date().toISOString(),
      });
    });
    return this.inspect(userId);
  }
}
