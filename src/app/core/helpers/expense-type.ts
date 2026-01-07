import { ExpenseReason, ExpenseType } from "../models/expense";

export function getExpenseType(reason: ExpenseReason, override?: ExpenseType): ExpenseType {
  if (override && reason === 'OTHER') return override;
  
  switch (reason) {
    case 'FUEL':
    case 'MAINTENANCE':
    case 'STATIONERY':
      return 'COMPANY';
    case 'MEALS':
      return 'PERSONAL';
    case 'OTHER':
      return override || 'COMPANY';
    default:
      return 'COMPANY';
  }
}