import { MemorySubscriptionsRepository } from './memory-subscriptions.repository';
import { createDemoSubscriptions } from '../subscriptions.service';

describe('MemorySubscriptionsRepository', () => {
  it('rolls back all writes when a transaction fails', async () => {
    const repository = new MemorySubscriptionsRepository(
      createDemoSubscriptions(),
    );
    const before = await repository.findSubscription('demo-user', 'sub_1001');

    await expect(
      repository.transaction(async (transaction) => {
        const record = await transaction.findSubscription(
          'demo-user',
          'sub_1001',
        );
        if (!record) throw new Error('Missing seed record');
        record.name = 'Changed inside failed transaction';
        await transaction.saveSubscription(record);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');

    const after = await repository.findSubscription('demo-user', 'sub_1001');
    expect(after?.name).toBe(before?.name);
  });
});
