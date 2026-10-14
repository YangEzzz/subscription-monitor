export type MembershipOrder = {
  id: string;
  userId: string;
  requestId: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  channel: 'simulation' | 'wechat' | 'virtual';
  transactionId?: string | null;
  paymentRequestedAt?: string | null;
  deliveryConfirmedAt?: string | null;
  status: 'pending' | 'paid' | 'cancelled' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};
