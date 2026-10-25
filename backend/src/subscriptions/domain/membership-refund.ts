export type MembershipRefund = {
  orderId: string;
  refundId: string;
  amount: number;
  status: 'submitting' | 'processing' | 'unknown' | 'succeeded' | 'failed';
  reason: string;
  reasonCode: string;
  operator: string;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};
