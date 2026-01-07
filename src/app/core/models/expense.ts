export type ExpenseReason = 'FUEL' | 'MEALS' | 'MAINTENANCE' | 'STATIONERY' | 'OTHER';

export type ExpenseStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export type ExpenseType = 'COMPANY' | 'PERSONAL';
export type ExpensePaymentMethod = 'CASH' | 'MPESA';


export interface Expense {
  id: string;
  reason: ExpenseReason;
  expenseType: ExpenseType;
  paymentMethod: ExpensePaymentMethod;
  amount: number;
  attachmentUrl: string;
  notes?: string;
  tripId?: string;
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
  expenseType: ExpenseType;
  amount: number;
  attachmentBase64: string;
  notes?: string;
  tripId?: string;
}
