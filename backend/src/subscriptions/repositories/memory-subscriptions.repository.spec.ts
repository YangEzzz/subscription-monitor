import { MemorySubscriptionsRepository } from './memory-subscriptions.repository';
import { SubscriptionsService } from '../subscriptions.service';

describe('MemorySubscriptionsRepository', () => {
  it('rolls back all writes when a transaction fails', async () => {
    const repository = new MemorySubscriptionsRepository();
    const service = new SubscriptionsService(repository);
    const created = (await service.create('user', {
      name: 'Original record',
      category: 'other',
      cycle: 'monthly',
      nextBillingDate: '2099-01-01',
    })) as { id: string };
    const before = await repository.findSubscription('user', created.id);

    await expect(
      repository.transaction(async (transaction) => {
        const record = await transaction.findSubscription('user', created.id);
        if (!record) throw new Error('Missing saved record');
        record.name = 'Changed inside failed transaction';
        await transaction.saveSubscription(record);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    const after = await repository.findSubscription('user', created.id);
    expect(after?.name).toBe(before?.name);
  });
});
