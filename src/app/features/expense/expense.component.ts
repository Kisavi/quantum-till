
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Expense, ExpenseReason } from '../../core/models/expense';
import { ExpenseService } from '../../core/services/expense.service';


@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, ButtonModule, TableModule,
    DialogModule, InputTextModule, InputNumberModule, SelectModule,
    CardModule, ToastModule
  ],
  providers: [MessageService],
  templateUrl: './expense.component.html'
})
export class ExpenseComponent implements OnInit {
  expenses: Expense[] = [];
  reasons: ExpenseReason[] = [];

  visibleDialog = false;          
  visibleImage = false;            
  visibleApproveConfirm = false;   
  visibleRejectConfirm = false;    

  selectedImage = '';
  expenseToApprove = '';
  expenseToReject = '';

  expenseForm!: FormGroup;
  rejectForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.reasons = this.expenseService.reasons;
    this.initForms();
    this.loadExpenses();
  }

  private initForms(): void {
    this.expenseForm = this.fb.group({
      reason: ['', Validators.required],
      otherReason: [''],
      amount: [null, [Validators.required, Validators.min(1)]],
      notes: [''],
      attachmentBase64: ['']
    });

    this.rejectForm = this.fb.group({
      reason: ['', Validators.required]
    });

    this.expenseForm.get('reason')?.valueChanges.subscribe(val => {
      if (val !== 'OTHER') this.expenseForm.get('otherReason')?.setValue('');
    });
  }

  loadExpenses(): void {
    this.expenses = this.expenseService.getAllExpenses();
  }

  get totalPending() { return this.expenseService.getTotalPending(); }
  get totalApproved() { return this.expenseService.getTotalApproved(); }

  showDialog(): void {
    this.expenseForm.reset();
    this.visibleDialog = true;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.expenseForm.patchValue({ attachmentBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  submitExpense(): void {
    if (this.expenseForm.invalid || !this.expenseForm.value.attachmentBase64) {
      this.expenseForm.markAllAsTouched();
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all required fields and attach receipt' });
      return;
    }

    const value = this.expenseForm.value;
    const dto = {
      reason: value.reason,
      otherReason: value.reason === 'OTHER' ? value.otherReason : undefined,
      amount: value.amount,
      notes: value.notes,
      attachmentBase64: value.attachmentBase64
    };

    this.expenseService.createExpense(dto);
    this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Expense sent for approval' });
    this.visibleDialog = false;
    this.loadExpenses();
  }

  // APPROVE FLOW
  approve(id: string): void {
    this.expenseToApprove = id;
    this.visibleApproveConfirm = true;
  }

  confirmApprove(): void {
    this.expenseService.approveExpense(this.expenseToApprove, 'Admin User');
    this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Expense approved successfully' });
    this.visibleApproveConfirm = false;
    this.loadExpenses();
  }

  // REJECT FLOW
  showRejectDialog(id: string): void {
    this.expenseToReject = id;
    this.rejectForm.reset();
    this.visibleRejectConfirm = true;
  }

  confirmReject(): void {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    this.expenseService.rejectExpense(this.expenseToReject, this.rejectForm.value.reason, 'Admin User');
    this.messageService.add({ severity: 'warn', summary: 'Rejected', detail: 'Expense has been rejected' });
    this.visibleRejectConfirm = false;
    this.loadExpenses();
  }

  viewReceipt(url: string): void {
    this.selectedImage = url;
    this.visibleImage = true;
  }

  getPreview(): string {
    return this.expenseForm.value.attachmentBase64 || 'https://via.placeholder.com/300x200?text=Receipt+Photo';
  }

  getExpenseAmount(id: string): number {
    return this.expenses.find(e => e.id === id)?.amount || 0;
  }

  getStatusClass(status: Expense['status']) {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}