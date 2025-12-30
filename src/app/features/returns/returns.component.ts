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
import { TimestampMillisPipe } from '../../core/pipes/timestamp-millis.pipe';
import { TagModule } from 'primeng/tag';


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
  isLoadingReturns = false;
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

  returnReasons: ReturnReason[] = ['EXPIRED', 'DAMAGED', 'SPOILT', 'WRONG_ITEM', 'OTHER'];
  returnReasonOptions = this.returnReasons.map(r => ({ label: r, value: r }));

  private currentUserId = 'ADMIN_UID';

  private customerService = inject(CustomerService);
  private productService = inject(ProductService);
  private confirmationService = inject(ConfirmationService)

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

  ngOnInit(): void {
    this.loadReturns();

    this.productService.getProducts().subscribe(p => this.products = p || []);

    this.customerService.getCustomers().subscribe(c => {
      this.customers = c || [];
      this.customerOptions = [
        // { label: 'All Customers', value: null },
        { label: 'Other', value: 'OTHER' },
        ...this.customers.map(c => ({ label: c.name, value: c.id }))
      ];
    });
  }

  // ---------------- FILTERS ----------------
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

  loadReturns(): void {
    this.isLoadingReturns = true;
    this.returnsService.getAllReturns().subscribe(data => {
      this.returns = data;
      this.applyFilters();
      this.isLoadingReturns = false;
    });
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

    const payload: ReturnItem = {
      id: this.editingReturnId ?? Date.now().toString(),
      ...(customer ? { customer } : { customerName: 'Other' }),
      product,
      quantity,
      reason,
      returnDate: new Date(),
      expiryDate: new Date(expiryDate),
      createdBy: this.currentUserId
    };

    this.isSavingReturn = true;

    if (this.editingReturnId) {
      await this.returnsService.updateReturn(payload);
      this.returns = this.returns.map(r => r.id === payload.id ? payload : r);
      this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Return updated successfully.' });
    } else {
      await this.returnsService.createReturn(payload);
      this.returns.push(payload);
      this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Return created successfully.' });
    }

    this.showReturnDialog = false;
    this.editingReturnId = null;
    this.applyFilters();
    this.isSavingReturn = false;
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
        this.deleteReturn(item)
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  async deleteReturn(item: ReturnItem): Promise<void> {
    await this.returnsService.deleteReturn(item.id);
    this.returns = this.returns.filter(r => r.id !== item.id);
    this.applyFilters();
  }

  formatQuantity(item: ReturnItem): string {
    const { packets, pieces } = this.calculatePacketsAndPieces(
      item.quantity,
      item.product.piecesPerPacket
    );
    return pieces > 0 ? `${packets} + ${pieces} pcs` : `${packets}`;
  }

  calculatePacketsAndPieces(total: number, perPacket: number) {
    if (perPacket <= 1) return { packets: total, pieces: 0 };
    return {
      packets: Math.floor(total / perPacket),
      pieces: total % perPacket
    };
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

    // Show badge only if deviation exists
    if (days > 0) {
      // Returned AFTER expiry date
      return `${days} day${days > 1 ? 's' : ''} past expiry`;
    } else if (days < 0) {
      // Returned BEFORE expiry date (premature spoilage)
      const daysEarly = Math.abs(days);
      return `${daysEarly} day${daysEarly > 1 ? 's' : ''} before expiry`;
    }

    // days === 0 (returned on expiry date) - no badge needed
    return null;
  }

  getExpiryDeviationSeverity(item: ReturnItem): 'danger' | 'success' {
    const days = this.getDaysFromExpiry(item);
    if (days === null) return 'success';

    // Red if returned before expiry date (quality issue - premature spoilage). TODO Ask if i should add this info in the ui or any cta
    if (days < 0) {
      return 'danger';
    }

    // Green if returned after expiry date (kept too long)
    return 'success';
  }
}
