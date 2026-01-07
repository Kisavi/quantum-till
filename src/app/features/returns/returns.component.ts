import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ReturnItem, ReturnReason } from '../../core/models/return-item';
import { Customer } from '../../core/models/customer';
import { Product } from '../../core/models/product';
import { ReturnsService } from '../../core/services/returns.service';
import { CustomerService } from '../../core/services/customer.service';
import { ProductService } from '../../core/services/product.service';
import { StockService } from '../../core/services/stock.service';
import { TimestampMillisPipe } from '../../core/pipes/timestamp-millis.pipe';
import { TagModule } from 'primeng/tag';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { EMPTY, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    TimestampMillisPipe,
    ConfirmDialogModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './returns.component.html',
})
export class ReturnsComponent implements OnInit {
  isLoadingReturns = true;
  isSavingReturn = false;

  returns: ReturnItem[] = [];
  filteredReturns: ReturnItem[] = [];
  editingReturnId: string | null = null;

  // Filters
  customerOptions: { label: string; value: string | null }[] = [];
  selectedCustomerId: string | null = null;
  dateRange: Date[] | null = null;

  totalReturnsAmount = 0;

  products: Product[] = [];
  customers: Customer[] = [];

  showReturnDialog = false;
  showPiecesInput = false;

  returnReasons: ReturnReason[] = ['EXPIRED', 'DAMAGED', 'SPOILT', 'UNSOLD', 'WRONG_ITEM', 'OTHER'];
  returnReasonOptions = this.returnReasons.map(r => ({ label: r, value: r }));
  tripId?: string;
  showFilters = true;


  private customerService = inject(CustomerService);
  private productService = inject(ProductService);
  private stockService = inject(StockService);
  private confirmationService = inject(ConfirmationService);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute)
  private userService = inject(UserService);
  isAdmin$ = this.userService.isAdmin();

  returnForm: FormGroup;

  constructor(
    private returnsService: ReturnsService,
    private messageService: MessageService,
    private fb: FormBuilder
  ) {
    this.returnForm = this.fb.group({
      customerId: ['', Validators.required],
      productId: ['', Validators.required],
      packets: [null],
      pieces: [null],
      expiryDate: [null, Validators.required],
      reason: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    this.tripId = this.route.snapshot.queryParams['tripId'];
    this.showFilters = !this.tripId;
    await this.loadReturns(); 

    this.productService.getProducts().subscribe(p => this.products = p || []);

    this.customerService.getCustomers().subscribe(c => {
      this.customers = c || [];
      this.customerOptions = [
        { label: 'Other', value: 'OTHER' },
        ...this.customers.map(c => ({ label: c.name, value: c.id }))
      ];
    });
  }

  async loadReturns(): Promise<void> {
    this.isLoadingReturns = true;

    try {
      const returns$ = this.getReturnsObservable();

      if (!returns$) {
        this.isLoadingReturns = false;
        return;
      }

      returns$.subscribe({
        next: data => {
          this.returns = data;
          this.applyFilters();
          this.isLoadingReturns = false;
        },
        error: err => {
          console.error('Error loading returns:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load returns'
          });
          this.isLoadingReturns = false;
        }
      });

    } catch (error) {
      console.error('Error loading returns:', error);
      this.isLoadingReturns = false;
    }
  }

private getReturnsObservable(): Observable<ReturnItem[]> {
  return this.userService.getCurrentUserRoles().pipe(
    switchMap(roles => {
      if (this.tripId) {
        console.log('Loading returns for trip:', this.tripId);
        return this.returnsService.getReturnsByTrip(this.tripId);
      }

      if (roles.isAdmin || roles.isManager) {
        console.log('Loading all returns for admin/manager');
        return this.returnsService.getAllReturns();
      }

      if (roles.isRider) {
        console.log('Loading returns for rider');
        const userId = this.auth.currentUser?.uid;
        if (userId) {
          return this.returnsService.getReturnsByUser(userId);
        }
      }

      return EMPTY;
    })
  );
}



  applyFilters(): void {
    let filtered = [...this.returns];

    if (this.selectedCustomerId) {
      if (this.selectedCustomerId === 'OTHER') {
        filtered = filtered.filter(r => !r.customer || r.customerName === 'Other');
      } else {
        filtered = filtered.filter(r => r.customer?.id === this.selectedCustomerId);
      }
    }

    if (this.dateRange && this.dateRange.length === 2) {
      const [start, end] = this.dateRange;

      const startMs = new Date(start).setHours(0, 0, 0, 0);
      const endMs = new Date(end).setHours(23, 59, 59, 999);

      filtered = filtered.filter(r => {
        let returnMs: number;

        if ((r.returnDate as any)?.seconds !== undefined) {
          returnMs = (r.returnDate as any).seconds * 1000;
        }
        else if (typeof r.returnDate === 'number') {
          returnMs = r.returnDate;
        }
        else {
          returnMs = new Date(r.returnDate as any).getTime();
        }

        return returnMs >= startMs && returnMs <= endMs;
      });
    }

    this.filteredReturns = filtered;
    this.calculateTotal();
  }

  calculateTotal(): void {
    this.totalReturnsAmount = this.filteredReturns.reduce(
      (sum, r) => sum + r.product.unitPrice * r.quantity, 0
    );
  }

  clearFilters(): void {
    this.selectedCustomerId = null;
    this.dateRange = null;
    this.applyFilters();
  }



  showTakeReturnDialog(): void {
    this.editingReturnId = null;
    this.returnForm.reset();
    this.showPiecesInput = false;
    this.showReturnDialog = true;
  }

  editReturn(item: ReturnItem): void {
    this.editingReturnId = item.id;
    this.showReturnDialog = true;

    const breakdown = this.calculatePacketsAndPieces(
      item.quantity,
      item.product.piecesPerPacket
    );

    this.returnForm.patchValue({
      customerId: item.customer?.id || 'OTHER',
      productId: item.product.id,
      packets: breakdown.packets,
      pieces: breakdown.pieces,
      expiryDate: this.toDate(item.expiryDate),
      reason: item.reason
    });

    this.onProductChange(item.product.id);
  }

  onProductChange(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    this.showPiecesInput = !!product && product.piecesPerPacket > 1;
  }

  toDate(timestamp: any): Date {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
  }

  getManufacturedDate(item: ReturnItem): Date | null {
    if (!item.expiryDate || !item.product.shelfLife) return null;

    const expiry = this.toDate(item.expiryDate);
    const shelfLifeMs = item.product.shelfLife * 24 * 60 * 60 * 1000;
    return new Date(expiry.getTime() - shelfLifeMs);
  }

  async submitReturn(): Promise<void> {
    if (this.returnForm.invalid) return;

    const { customerId, productId, packets, pieces, expiryDate, reason } = this.returnForm.value;
    const product = this.products.find(p => p.id === productId)!;
    const customer = customerId === 'OTHER' ? null : this.customers.find(c => c.id === customerId)!;

    const quantity =
      (Number(packets) || 0) * product.piecesPerPacket +
      (Number(pieces) || 0);

    const expiryDateString = this.formatDateToString(new Date(expiryDate));
    const currentUserId = this.auth.currentUser?.uid;

    if (!currentUserId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User not authenticated'
      });
      return;
    }

    const payload: ReturnItem = {
      id: this.editingReturnId ?? Date.now().toString(),
      ...(this.tripId && { tripId: this.tripId }),
      ...(customer ? { customer } : { customerName: 'Other' }),
      product,
      quantity,
      reason,
      returnDate: new Date(),
      expiryDate: new Date(expiryDate),
      createdBy: currentUserId
    };

    this.isSavingReturn = true;

    try {
      if (this.editingReturnId) {
        await this.returnsService.updateReturn(payload);
        this.returns = this.returns.map(r => r.id === payload.id ? payload : r);
        this.messageService.add({
          severity: 'success',
          summary: 'Updated',
          detail: 'Return updated successfully.'
        });
      } else {
        // Create the return
        await this.returnsService.createReturn(payload);
        this.returns.push(payload);

        // Handle stock restoration based on context
        if (reason === 'UNSOLD') {
          if (this.tripId) {
            // Trip context: Stock tracked in trip allocation (dashboard calculation handles it)
            this.messageService.add({
              severity: 'success',
              summary: 'Created',
              detail: 'Return created successfully. Stock returned to your allocation.'
            });
          } else {
            // Non-trip context CONTEXT: Restore to general warehouse stock
            try {
              await this.stockService.increaseStock(
                product.id,
                quantity,
                expiryDateString,
                product
              );

              this.messageService.add({
                severity: 'success',
                summary: 'Created',
                detail: 'Return created and stock restored to warehouse.'
              });
            } catch (stockError: any) {
              console.error('Error restoring stock:', stockError);
              this.messageService.add({
                severity: 'warn',
                summary: 'Partial Success',
                detail: 'Return created but failed to restore stock. Please check stock manually.'
              });
            }
          }
        } else {
          // DAMAGED/EXPIRED/SPOILT: Replacement given (for trip) or just recorded (non-trip)
          this.messageService.add({
            severity: 'success',
            summary: 'Created',
            detail: this.tripId
              ? `Return created successfully (${reason} - replacement given from stock).`
              : `Return created successfully (${reason} - not added to stock).`
          });
        }
      }

      this.showReturnDialog = false;
      this.editingReturnId = null;
      this.applyFilters();
    } catch (error: any) {
      console.error('Error submitting return:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to submit return'
      });
    } finally {
      this.isSavingReturn = false;
    }
  }

  confirmDeleteReturn(item: ReturnItem) {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${item.product.name} return entry?`,
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
        this.deleteReturn(item);
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelled',
          detail: 'Deletion cancelled'
        });
      },
    });
  }

  async deleteReturn(item: ReturnItem): Promise<void> {
    try {
      await this.returnsService.deleteReturn(item.id);
      this.returns = this.returns.filter(r => r.id !== item.id);

      // If the return was UNSOLD, remove it from stock again
      if (item.reason === 'UNSOLD') {
        try {
          const expiryDateString = this.formatDateToString(this.toDate(item.expiryDate));

          await this.stockService.reduceStock(
            item.product.id,
            item.quantity
          );

          this.messageService.add({
            severity: 'success',
            summary: 'Deleted',
            detail: 'Return deleted and stock adjusted successfully.'
          });
        } catch (stockError: any) {
          console.error('Error adjusting stock:', stockError);
          this.messageService.add({
            severity: 'warn',
            summary: 'Partial Success',
            detail: 'Return deleted but failed to adjust stock. Please check stock manually.'
          });
        }
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Deleted',
          detail: 'Return deleted successfully.'
        });
      }

      this.applyFilters();
    } catch (error: any) {
      console.error('Error deleting return:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to delete return'
      });
    }
  }

  formatQuantity(item: ReturnItem): string {
    const { packets, pieces } = this.calculatePacketsAndPieces(
      item.quantity,
      item.product.piecesPerPacket
    );
    return pieces > 0 ? `${packets} ${packets > 1 ? 'pcts' : 'pct'} + ${pieces} ${pieces > 1 ? 'pcs' : 'pc'}` : `${packets} ${packets > 1 ? 'pcts' : 'pct'}`;
  }

  calculatePacketsAndPieces(total: number, perPacket: number) {
    if (perPacket <= 1) return { packets: total, pieces: 0 };
    return {
      packets: Math.floor(total / perPacket),
      pieces: total % perPacket
    };
  }

  // Helper to format Date to yyyy-MM-dd string
  formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Calculate days difference between return date and expiry date
  getDaysFromExpiry(item: ReturnItem): number | null {
    if (item.reason !== 'EXPIRED' && item.reason !== 'SPOILT') return null;
    if (!item.expiryDate || !item.returnDate) return null;

    const expiryMs = this.toDate(item.expiryDate).getTime();
    const returnMs = this.toDate(item.returnDate).getTime();

    const diffMs = returnMs - expiryMs;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  // Get message only if there's a significant deviation
  getExpiryDeviationMessage(item: ReturnItem): string | null {
    const days = this.getDaysFromExpiry(item);
    if (days === null) return null;

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} past expiry`;
    } else if (days < 0) {
      const daysEarly = Math.abs(days);
      return `${daysEarly} day${daysEarly > 1 ? 's' : ''} before expiry`;
    }

    return null;
  }

  getExpiryDeviationSeverity(item: ReturnItem): 'danger' | 'success' {
    const days = this.getDaysFromExpiry(item);
    if (days === null) return 'success';

    if (days < 0) {
      return 'danger';
    }

    return 'success';
  }
}