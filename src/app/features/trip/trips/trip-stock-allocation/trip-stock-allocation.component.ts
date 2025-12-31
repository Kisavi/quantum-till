import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TripStockAllocation } from '../../../../core/models/trip-stock-allocation';
import { Product } from '../../../../core/models/product';
import { ProductService } from '../../../../core/services/product.service';
import { Trip } from '../../../../core/models/trip';



@Component({
  selector: 'app-trip-stock-allocation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    SelectModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './trip-stock-allocation.component.html'
})
export class TripStockAllocationComponent implements OnInit {
   @Input() selectedTrip: Trip | null = null;
  allocations: TripStockAllocation[] = [];
  filteredAllocations: TripStockAllocation[] = [];
  products: Product[] = [];

  allocationForm: FormGroup;
  isLoadingAllocations = false;
  isSavingAllocation = false;
  editingAllocationId: string | null = null;
  showPiecesInput = false;

  private stockService = inject(StockService);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private fb = inject(FormBuilder);

  // selectedTrip: Trip | null = null;

  constructor() {
    this.allocationForm = this.fb.group({
      productId: ['', Validators.required],
      packets: [null],
      pieces: [null]
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    if (this.selectedTrip) {
      this.loadAllocations();
    }
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe(p => this.products = p || []);
  }

  loadAllocations(): void {
    if (!this.selectedTrip) return;
    this.isLoadingAllocations = true;
    this.stockService.getAllocationsByTrip(this.selectedTrip.id!).subscribe({
      next: data => {
        this.allocations = data;
        this.filteredAllocations = [...data];
        this.isLoadingAllocations = false;
      },
      error: err => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load allocations.' });
        this.isLoadingAllocations = false;
      }
    });
  }

  showAllocationForm(): void {
    this.editingAllocationId = null;
    this.allocationForm.reset();
    this.showPiecesInput = false;
  }

  onProductChange(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    this.showPiecesInput = !!product && product.piecesPerPacket > 1;
    if (!this.showPiecesInput) {
      this.allocationForm.patchValue({ pieces: null });
    }
  }

  editAllocation(allocation: TripStockAllocation): void {
    this.editingAllocationId = allocation.id;
    const breakdown = this.calculatePacketsAndPieces(allocation.quantity, allocation.product.piecesPerPacket);
    this.allocationForm.patchValue({
      productId: allocation.product.id,
      packets: breakdown.packets,
      pieces: breakdown.pieces
    });
    this.onProductChange(allocation.product.id);
  }

  async submitAllocation(): Promise<void> {
    if (this.allocationForm.invalid || !this.selectedTrip) return;

    const { productId, packets, pieces } = this.allocationForm.value;
    const product = this.products.find(p => p.id === productId)!;
    const quantity = (Number(packets) || 0) * product.piecesPerPacket + (Number(pieces) || 0);

    const payload: TripStockAllocation = {
      id: this.editingAllocationId ?? Date.now().toString(),
      tripId: this.selectedTrip.id!,
      product,
      quantity
    };

    this.isSavingAllocation = true;
    try {
      if (this.editingAllocationId) {
        await this.stockService.updateAllocation(payload);
        this.allocations = this.allocations.map(a => a.id === payload.id ? payload : a);
        this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'Allocation updated.' });
      } else {
        await this.stockService.addAllocation(payload);
        this.allocations.push(payload);
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Allocation added.' });
      }
      this.filteredAllocations = [...this.allocations];
      this.allocationForm.reset();
      this.editingAllocationId = null;
      this.showPiecesInput = false;
    } finally {
      this.isSavingAllocation = false;
    }
  }

  confirmDeleteAllocation(allocation: TripStockAllocation): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete allocation of ${allocation.product.name}?`,
      header: 'Confirm Delete',
      icon: 'pi pi-info-circle',
      accept: async () => this.deleteAllocation(allocation),
      reject: () => { }
    });
  }

  async deleteAllocation(allocation: TripStockAllocation): Promise<void> {
    await this.stockService.deleteAllocation(allocation.id);
    this.allocations = this.allocations.filter(a => a.id !== allocation.id);
    this.filteredAllocations = [...this.allocations];
    this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Allocation removed.' });
  }

  formatQuantity(quantity: number, product: Product): string {
    const { packets, pieces } = this.calculatePacketsAndPieces(quantity, product.piecesPerPacket);
    return pieces > 0 ? `${packets} + ${pieces} pcs` : `${packets}`;
  }

  calculatePacketsAndPieces(total: number, perPacket: number) {
    if (!perPacket || perPacket <= 1) return { packets: total, pieces: 0 };
    return {
      packets: Math.floor(total / perPacket),
      pieces: total % perPacket
    };
  }
}
