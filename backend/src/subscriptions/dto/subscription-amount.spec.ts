import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateSubscriptionDto } from './create-subscription.dto';
import { UpdateSubscriptionDto } from './update-subscription.dto';

const validInput = {
  name: '测试订阅',
  category: 'other',
  cycle: 'monthly',
  nextBillingDate: '2028-01-31',
};

describe('Subscription amount validation', () => {
  it.each([undefined, null, '', '   ', false, -1, 1.234])(
    'rejects missing or invalid create amount %p',
    (amount) => {
      const dto = plainToInstance(CreateSubscriptionDto, {
        ...validInput,
        amount,
      });
      expect(
        validateSync(dto).some((error) => error.property === 'amount'),
      ).toBe(true);
    },
  );

  it.each([0, '0', 12.5, '12.50'])(
    'accepts zero and valid create amount %p',
    (amount) => {
      const dto = plainToInstance(CreateSubscriptionDto, {
        ...validInput,
        amount,
      });
      expect(validateSync(dto)).toEqual([]);
      expect(dto.amount).toBe(Number(amount));
    },
  );

  it.each([null, '', '   ', false, -1, 1.234])(
    'rejects clearing or invalid update amount %p',
    (amount) => {
      const dto = plainToInstance(UpdateSubscriptionDto, { amount });
      expect(
        validateSync(dto).some((error) => error.property === 'amount'),
      ).toBe(true);
    },
  );

  it('allows status-only updates, nullable trial dates and a zero amount', () => {
    for (const input of [
      { status: 'paused' },
      { trialEndDate: null },
      { amount: 0 },
    ]) {
      expect(
        validateSync(plainToInstance(UpdateSubscriptionDto, input)),
      ).toEqual([]);
    }
  });
});
