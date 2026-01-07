import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, EMPTY, finalize, Observable, of, Subscription, switchMap, tap } from 'rxjs';
import { Expense, ExpenseReason } from '../../core/models/expense';
import { ExpenseService } from '../../core/services/expense.service';
import { FloatLabel } from 'primeng/floatlabel';
import { AuthService } from '../../core/services/auth.service';
import { compressImageFile } from '../../core/helpers/image-helpers';
import { TimestampMillisPipe } from '../../core/pipes/timestamp-millis.pipe';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ActivatedRoute } from '@angular/router';
import { getExpenseType } from '../../core/helpers/expense-type';
import { UserService } from '../../core/services/user.service';
import { Auth } from '@angular/fire/auth';


@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CardModule,
    ToastModule,
    FloatLabel,
    TimestampMillisPipe,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './expense.component.html'
})
export class ExpenseComponent implements OnInit, OnDestroy {
  expenses$!: Observable<Expense[]>;
  expensesCache: Expense[] = [];
  reasons: ExpenseReason[] = [];
  expenseTypes = [
    { label: 'Company Expense', value: 'COMPANY' },
    { label: 'Personal Expense', value: 'PERSONAL' }
  ];
  paymentMethods = [
    { label: 'CASH', value: 'CASH' },
    { label: 'M-PESA', value: 'MPESA' }
  ];

  visibleDialog = false;
  visibleImage = false;
  visibleApproveConfirm = false;
  visibleRejectConfirm = false;

  selectedImage = '';
  expenseToApprove = '';
  expenseToReject = '';

  expenseForm!: FormGroup;
  rejectForm!: FormGroup;

  // Loading states
  isLoadingExpenses = true;
  isSubmittingExpense = false;
  isApprovingExpense = false;
  isRejectingExpense = false;

  // Computed values
  totalPending = 0;
  totalApproved = 0;
  editingExpenseId: string | null = null;
  tripId: string | null = null;

  private expensesSubscription?: Subscription;
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private auth = inject(Auth);
  isAdmin$ = this.userService.isAdmin();

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private messageService: MessageService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
  ) { }

  ngOnInit(): void {
    this.tripId = this.route.snapshot.queryParams['tripId'];
    this.reasons = this.expenseService.reasons;
    this.initForms();
    this.loadExpenses();
  }

  ngOnDestroy(): void {
    this.expensesSubscription?.unsubscribe();
  }


  private initForms(): void {
    this.expenseForm = this.fb.group({
      reason: ['', Validators.required],
      expenseType: [''],
      paymentMethod: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      notes: [''],
      attachmentBase64: ['']
    });

    this.rejectForm = this.fb.group({
      reason: ['', Validators.required]
    });

    this.expenseForm.get('reason')?.valueChanges.subscribe(reason => {
      const notesCtrl = this.expenseForm.get('notes');
      const expenseTypeCtrl = this.expenseForm.get('expenseType');

      if (reason === 'OTHER') {
        notesCtrl?.setValidators([Validators.required, Validators.minLength(5)]);
        expenseTypeCtrl?.setValidators([Validators.required]);
        expenseTypeCtrl?.enable();
      } else {
        notesCtrl?.clearValidators();
        const autoType = getExpenseType(reason);
        expenseTypeCtrl?.setValue(autoType);
        expenseTypeCtrl?.clearValidators();
        expenseTypeCtrl?.disable();
      }

      notesCtrl?.updateValueAndValidity();
      expenseTypeCtrl?.updateValueAndValidity();
    });
  }

private loadExpenses(): void {
    this.expenses$ = this.getExpensesObservable().pipe(
      tap(expenses => {
        this.expensesCache = expenses;
        this.calculateTotalsFromList(expenses);
      }),
      catchError(error => {
        console.error('Error loading expenses:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load expenses'
        });
        return of([]);
      })
    );
  }

  private getExpensesObservable(): Observable<Expense[]> {
    return this.userService.getCurrentUserRoles().pipe(
      switchMap(roles => {
        // Show only expenses for this trip
        if (this.tripId) {
          console.log('Loading expenses for trip:', this.tripId);
          return this.expenseService.getExpensesByTrip(this.tripId);
        }

        // Show all expenses
        if (roles.isAdmin || roles.isManager) {
          console.log('Loading all expenses for admin/manager');
          return this.expenseService.getExpenses();
        }

        // Show only their expenses
        if (roles.isRider) {
          console.log('Loading expenses for rider');
          const userId = this.auth.currentUser?.uid;
          if (userId) {
            return this.expenseService.getExpensesByUser(userId);
          }
        }

        return EMPTY;
      })
    );
  }

  private calculateTotalsFromList(expenses: Expense[]): void {
    this.totalPending = expenses
      .filter(e => e.status === 'PENDING')
      .reduce((sum, e) => sum + e.amount, 0);

    this.totalApproved = expenses
      .filter(e => e.status === 'APPROVED')
      .reduce((sum, e) => sum + e.amount, 0);
  }

  showDialog(): void {
    this.expenseForm.reset();
    this.visibleDialog = true;
  }

  async onFileChange(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (!file) return;

    try {
      // Compress image to <= 1MB
      const compressedBase64 = await compressImageFile(file, 1);

      // Update form value with compressed Base64
      this.expenseForm.patchValue({ attachmentBase64: compressedBase64 });
    } catch (err) {
      console.error('Error compressing image', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to process image. Try a smaller file.'
      });
    }
  }




  async submitExpense(): Promise<void> {
    if (this.expenseForm.invalid || !this.expenseForm.value.attachmentBase64) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    this.isSubmittingExpense = true;

    try {
      const value = this.expenseForm.value;
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser.uid) return;

      const expenseType = getExpenseType(
        value.reason,
        value.reason === 'OTHER' ? value.expenseType : undefined
      );

      const expensePayload: Partial<Omit<Expense, 'id'>> = {
        reason: value.reason,
        expenseType: expenseType,
        paymentMethod: value.paymentMethod,
        amount: value.amount,
        notes: value.notes || '',
        attachmentUrl: value.attachmentBase64,
        updatedAt: new Date(),
        ...(this.tripId && { tripId: this.tripId })
      };
      console.log(expensePayload);

      if (this.editingExpenseId) {
        await this.expenseService.updateExpense(this.editingExpenseId, expensePayload);
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Expense updated successfully'
        });
      } else {
        await this.expenseService.addExpense({
          ...expensePayload,
          userId: currentUser.uid,
          userName: currentUser.email!,
          createdAt: new Date(),
          status: 'PENDING'
        } as Omit<Expense, 'id'>);

        this.messageService.add({
          severity: 'success',
          summary: 'Submitted',
          detail: 'Expense sent for approval'
        });
      }

      this.visibleDialog = false;
      this.expenseForm.reset();
      this.selectedImage = '';
      this.editingExpenseId = null;

    } catch (error) {
      console.error(error);
    } finally {
      this.isSubmittingExpense = false;
    }
  }


  approve(id: string): void {
    this.expenseToApprove = id;
    this.visibleApproveConfirm = true;
  }

  async confirmApprove(): Promise<void> {
    this.isApprovingExpense = true;

    try {
      const currentUser = { uid: 'admin1', name: 'Admin User' }; // Replace with actual auth

      const updates: Partial<Omit<Expense, 'id'>> = {
        status: 'APPROVED',
        approvedBy: currentUser.uid,
        approvedByName: currentUser.name,
        approvedAt: new Date(),
        updatedAt: new Date()
      };

      await this.expenseService.updateExpense(this.expenseToApprove, updates);

      this.messageService.add({
        severity: 'success',
        summary: 'Approved',
        detail: 'Expense approved successfully'
      });

      this.visibleApproveConfirm = false;
    } catch (error) {
      console.error('Error approving expense:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to approve expense'
      });
    } finally {
      this.isApprovingExpense = false;
    }
  }

  showRejectDialog(id: string): void {
    this.expenseToReject = id;
    this.rejectForm.reset();
    this.visibleRejectConfirm = true;
  }

  async confirmReject(): Promise<void> {
    if (this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    this.isRejectingExpense = true;

    try {
      const currentUser = { uid: 'admin1', name: 'Admin User' }; // Replace with actual auth

      const updates: Partial<Omit<Expense, 'id'>> = {
        status: 'REJECTED',
        rejectionReason: this.rejectForm.value.reason,
        approvedBy: currentUser.uid,
        approvedByName: currentUser.name,
        updatedAt: new Date()
      };

      await this.expenseService.updateExpense(this.expenseToReject, updates);

      this.messageService.add({
        severity: 'warn',
        summary: 'Rejected',
        detail: 'Expense has been rejected'
      });

      this.visibleRejectConfirm = false;
      this.rejectForm.reset();
    } catch (error) {
      console.error('Error rejecting expense:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to reject expense'
      });
    } finally {
      this.isRejectingExpense = false;
    }
  }

  editExpense(expense: Expense): void {
    this.editingExpenseId = expense.id;
    this.visibleDialog = true;

    this.expenseForm.patchValue({
      reason: expense.reason,
      expenseType: expense.expenseType,
      paymentMethod: expense.paymentMethod,
      amount: expense.amount,
      notes: expense.notes || '',
      attachmentBase64: expense.attachmentUrl
    });
  }

  confirmDeleteExpense(expenseId: string) {
    console.log("fire")
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this expense?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        this.deleteExpense(expenseId)
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      await this.expenseService.deleteExpense(id);
      this.messageService.add({
        severity: 'warn',
        summary: 'Deleted',
        detail: 'Expense deleted'
      });
    } catch (error) {
      console.error('Delete failed', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete expense'
      });
    }
  }



  viewReceipt(url: string): void {
    this.selectedImage = url;
    this.visibleImage = true;
  }

  getPreview(): string {
    return this.expenseForm.value.attachmentBase64 || 'https://via.placeholder.com/300x200?text=Receipt+Photo';
  }


  getExpenseAmount(id: string): number {
    return this.expensesCache.find(e => e.id === id)?.amount || 0;
  }

  getStatusClass(status: Expense['status']): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  toDate(timestamp: any): Date {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
  }
}