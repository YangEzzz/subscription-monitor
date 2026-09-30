export type MembershipOrder = {
  id: string;
  userId: string;
  requestId: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  channel: 'simulation';
  status: 'pending' | 'paid' | 'cancelled' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
};
