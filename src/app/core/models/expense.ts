export interface Expense {
  id: string;
  reason: ExpenseReason;
  userId: string;
  amount: number;
  attachment: string;
}

export type ExpenseReason = 'FUEL' | 'MEALS' | 'MAINTENANCE' | 'STATIONERY' | 'OTHER';
