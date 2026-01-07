import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query,
  orderBy,
  where
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
    const q = query(
      this.expensesCol,
      orderBy('createdAt', 'desc')
    )
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
  }

   //  get expenses by user (for riders to see only their expenses)
  getExpensesByUser(userId: string): Observable<Expense[]> {
    const q = query(
      this.expensesCol,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      
    );
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
  }

  // get trip specific expenses
  getExpensesByTrip(tripId: string): Observable<Expense[]> {
    const q = query(
      this.expensesCol,
      where('tripId', '==', tripId),
      orderBy('createdAt', 'desc'),
      
    );
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
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