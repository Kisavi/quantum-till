import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from '@angular/fire/firestore';
import { 
  Storage, 
  ref, 
  uploadString, 
  getDownloadURL 
} from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { Expense, ExpenseReason } from '../models/expense';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private expensesCol;


  readonly reasons: ExpenseReason[] = ['FUEL', 'MEALS', 'MAINTENANCE', 'STATIONERY', 'OTHER'];

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private injector: Injector
  ) {
    this.expensesCol = collection(this.firestore, 'expenses');
  }

  // Get all expenses
  getExpenses(): Observable<Expense[]> {
    return collectionData(this.expensesCol, { idField: 'id' }) as Observable<Expense[]>;
  }

  // Add expense
  async addExpense(expense: Omit<Expense, 'id'>): Promise<string> {
    const ref = doc(this.expensesCol);
    await setDoc(ref, expense);
    return ref.id;
  }

  // Update expense
  async updateExpense(id: string, changes: Partial<Omit<Expense, 'id'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'expenses', id), changes);
  }

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'expenses', id));
  }

}