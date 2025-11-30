export type ExpenseReason = 'FUEL' | 'MEALS' | 'MAINTENANCE' | 'STATIONERY' | 'OTHER';

export type ExpenseStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export interface Expense {
  id: string;
  reason: ExpenseReason;
  amount: number;
  attachmentUrl: string;
  notes?: string;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface CreateExpenseDto {
  reason: ExpenseReason;
  amount: number;
  attachmentBase64: string;
  notes?: string;
}
