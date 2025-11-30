

import { Injectable } from '@angular/core';
import { CreateExpenseDto, Expense, ExpenseReason } from '../models/expense';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expenses: Expense[] = [
    {
      id: 'e1',
      reason: 'FUEL',
      amount: 4500,
      attachmentUrl: 'https://images.unsplash.com/photo-1622214365189-4029b9ebed22?w=600',
      notes: 'Trip to Mombasa',
      userId: 'driver1',
      userName: 'John Doe',
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 86400000),
      status: 'APPROVED',
      approvedBy: 'admin1',
      approvedByName: 'Mary Admin',
      approvedAt: new Date(Date.now() - 70000000)
    }
  ];

  readonly reasons: ExpenseReason[] = ['FUEL', 'MEALS', 'MAINTENANCE', 'STATIONERY', 'OTHER'];

  getCurrentUser() {
    return { uid: 'driver1', name: 'John Doe' }; 
  }

  createExpense(dto: CreateExpenseDto): Expense {
    const newExpense: Expense = {
      id: 'e' + Date.now(),
      reason: dto.reason,
      amount: dto.amount,
      attachmentUrl: dto.attachmentBase64, 
      notes: dto.notes,
      userId: this.getCurrentUser().uid,
      userName: this.getCurrentUser().name,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'PENDING'
    };
    this.expenses.unshift(newExpense);
    return newExpense;
  }

  approveExpense(id: string, adminName: string): Expense {
    const exp = this.expenses.find(e => e.id === id);
    if (!exp) throw new Error('Not found');
    exp.status = 'APPROVED';
    exp.approvedBy = 'admin1';
    exp.approvedByName = adminName;
    exp.approvedAt = new Date();
    exp.updatedAt = new Date();
    return exp;
  }

  rejectExpense(id: string, reason: string, adminName: string): Expense {
    const exp = this.expenses.find(e => e.id === id);
    if (!exp) throw new Error('Not found');
    exp.status = 'REJECTED';
    exp.rejectionReason = reason;
    exp.approvedBy = 'admin1';
    exp.approvedByName = adminName;
    exp.updatedAt = new Date();
    return exp;
  }

  getAllExpenses(): Expense[] {
    return [...this.expenses];
  }

  getTotalPending(): number {
    return this.expenses
      .filter(e => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0);
  }

  getTotalApproved(): number {
    return this.expenses
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + e.amount, 0);
  }
}
