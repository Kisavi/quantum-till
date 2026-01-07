import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TripAllocationService } from '../../../../core/services/trip-allocation.service';
import { Trip } from '../../../../core/models/trip';
import { insufficientStockProducts, TripStockAllocation } from '../../../../core/models/trip-stock-allocation';
import { Product } from '../../../../core/models/product';
import { ProductService } from '../../../../core/services/product.service';
import { Auth } from '@angular/fire/auth';
import { StockService } from '../../../../core/services/stock.service';
import { LoaderSkeletonComponent } from '../../../../core/shared/loader-skeleton/loader-skeleton.component';
import { doc, getDoc } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../../../core/services/user.service';

@Component({
  selector: 'app-trip-stock-allocation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    CardModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    LoaderSkeletonComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './trip-stock-allocation.component.html'
})
export class TripStockAllocationComponent implements OnInit {
  @Input() selectedTrip: Trip | null = null;

  allocations: TripStockAllocation[] = [];
  products: Product[] = [];

  // Loading states
  isLoadingAllocations = false;
  isSavingAllocation = false;
  isDeletingAllocation = false;
  isLoadingProducts = true;

  // Bulk allocation properties
  productSearchTerm = '';
  productQuantities: Map<string, { packets: number; pieces: number }> = new Map();
  showInsufficientStockDialog = false;
  insufficientStockProducts: insufficientStockProducts[] = [];
  productStockLevels: Map<string, number> = new Map();


  private stockAllocationService = inject(TripAllocationService);
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private userService = inject(UserService);
  private stockService = inject(StockService);

  get totalQuantity(): number {
    return this.allocations.reduce((sum, a) => sum + a.quantity, 0);
  }

  get selectedProductsCount(): number {
    return Array.from(this.productQuantities.values())
      .filter(q => q.packets > 0 || q.pieces > 0).length;
  }

  ngOnInit(): void {
    this.loadProducts();
    if (this.selectedTrip) {
      this.loadAllocations();
    }
  }

  async loadProducts(): Promise<void> {
    this.productService.getProducts().subscribe({
      next: async (products) => {
        this.isLoadingProducts = false;
        this.products = products || [];

        // Load stock levels for each product
        await this.loadStockLevels();
      },
      error: () => {
        this.isLoadingProducts = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load products'
        });
      }
    });
  }

  async loadStockLevels(): Promise<void> {
    const stockPromises = this.products.map(async (product) => {
      const quantity = await this.stockService.getStockQuantity(product.id);
      this.productStockLevels.set(product.id, quantity);
    });

    await Promise.all(stockPromises);
  }

  loadAllocations(): void {
    if (!this.selectedTrip) return;

    this.isLoadingAllocations = true;
    this.stockAllocationService.getAllocationsByTrip(this.selectedTrip.id!).subscribe({
      next: data => {
        this.allocations = data;
        this.isLoadingAllocations = false;
      },
      error: err => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load allocations'
        });
        this.isLoadingAllocations = false;
      }
    });
  }

  // Helper to get available stock
  getAvailableStock(productId: string): number {
    return this.productStockLevels.get(productId) || 0;
  }

  formatStockQuantity(productId: string): string {
    const product = this.products.find(p => p.id === productId);
    if (!product) return '0';

    const totalStock = this.getAvailableStock(productId);

    if (product.piecesPerPacket <= 1) {
      return `${totalStock} pkts`;
    }

    const packets = Math.floor(totalStock / product.piecesPerPacket);
    const pieces = totalStock % product.piecesPerPacket;

    if (packets === 0 && pieces === 0) return '0';
    if (packets === 0) return `${pieces} ${pieces > 1 ? 'pcs' : 'pc'}`;
    if (pieces === 0) return `${packets} ${packets > 1 ? 'pkts' : 'pkt'}`;

    return `${packets} ${packets > 1 ? 'pkts' : 'pkt'} + ${pieces} ${pieces > 1 ? 'pcs' : 'pc'}`;
  }

  // Helper to check if product is in stock
  isProductInStock(productId: string): boolean {
    return this.getAvailableStock(productId) > 0;
  }

  // Get max packets available
  getMaxPackets(product: Product): number {
    const totalStock = this.getAvailableStock(product.id);
    return Math.floor(totalStock / product.piecesPerPacket);
  }

  // Get max pieces available (after packets)
  getMaxPieces(product: Product, currentPackets: number): number {
    const totalStock = this.getAvailableStock(product.id);
    const usedByPackets = currentPackets * product.piecesPerPacket;
    const remaining = totalStock - usedByPackets;

    if (product.piecesPerPacket > 1) {
      return Math.min(remaining, product.piecesPerPacket - 1);
    }
    return 0;
  }

  // Quantity management methods
  getProductQuantity(productId: string): number {
    const qty = this.productQuantities.get(productId);
    if (!qty) return 0;
    const product = this.products.find(p => p.id === productId);
    if (!product) return 0;
    return qty.packets * product.piecesPerPacket + qty.pieces;
  }

  getProductPackets(productId: string): number {
    return this.productQuantities.get(productId)?.packets || 0;
  }

  getProductPieces(productId: string): number {
    return this.productQuantities.get(productId)?.pieces || 0;
  }

  setProductPackets(productId: string, event: any): void {
    const value = parseInt(event.target.value) || 0;
    const current = this.productQuantities.get(productId) || { packets: 0, pieces: 0 };
    this.productQuantities.set(productId, { ...current, packets: Math.max(0, value) });
  }

  setProductPieces(productId: string, event: any): void {
    const value = parseInt(event.target.value) || 0;
    const product = this.products.find(p => p.id === productId);
    const maxPieces = product ? product.piecesPerPacket - 1 : 0;
    const current = this.productQuantities.get(productId) || { packets: 0, pieces: 0 };
    this.productQuantities.set(productId, { ...current, pieces: Math.min(Math.max(0, value), maxPieces) });
  }

  get filteredProducts(): Product[] {
    let filtered = this.products;

    // Filter by search term
    if (this.productSearchTerm) {
      const term = this.productSearchTerm.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(term));
    }

    // Filter by stock availability
    filtered = filtered.filter(p => this.isProductInStock(p.id));

    return filtered;
  }

  incrementPackets(productId: string): void {
    const current = this.productQuantities.get(productId) || { packets: 0, pieces: 0 };
    const product = this.products.find(p => p.id === productId);

    if (product) {
      const maxPackets = this.getMaxPackets(product);
      if (current.packets < maxPackets) {
        this.productQuantities.set(productId, { ...current, packets: current.packets + 1 });
      }
    }
  }

  incrementPieces(productId: string): void {
    const current = this.productQuantities.get(productId) || { packets: 0, pieces: 0 };
    const product = this.products.find(p => p.id === productId);

    if (product) {
      const maxPieces = this.getMaxPieces(product, current.packets);
      if (current.pieces < maxPieces) {
        this.productQuantities.set(productId, { ...current, pieces: current.pieces + 1 });
      }
    }
  }

  decrementPackets(productId: string): void {
    const current = this.productQuantities.get(productId) || { packets: 0, pieces: 0 };
    this.productQuantities.set(productId, { ...current, packets: Math.max(0, current.packets - 1) });
  }

  decrementPieces(productId: string): void {
    const current = this.productQuantities.get(productId) || { packets: 0, pieces: 0 };
    this.productQuantities.set(productId, { ...current, pieces: Math.max(0, current.pieces - 1) });
  }

  formatProductQuantity(product: Product): string {
    const qty = this.productQuantities.get(product.id);
    if (!qty || (qty.packets === 0 && qty.pieces === 0)) return '—';

    if (product.piecesPerPacket > 1) {
      return qty.pieces > 0 ? `${qty.packets} + ${qty.pieces} pcs` : `${qty.packets}`;
    }
    return `${qty.packets}`;
  }

  clearAllAllocations(): void {
    this.productQuantities.clear();
  }

  async submitBulkAllocation(): Promise<void> {
    if (!this.selectedTrip || this.selectedProductsCount === 0) return;

  const currentUser = await firstValueFrom(this.userService.getCurrentUser());
    
    console.log(currentUser)
    if (!currentUser) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User not authenticated'
      });
      return;
    }

    this.isSavingAllocation = true;

    try {
      const allocations: Omit<TripStockAllocation, 'id'>[] = [];
      const stockCheckPromises: { product: Product; quantity: number; check: Promise<boolean> }[] = [];

      this.productQuantities.forEach((qty, productId) => {
        if (qty.packets > 0 || qty.pieces > 0) {
          const product = this.products.find(p => p.id === productId);
          if (product) {
            const quantity = qty.packets * product.piecesPerPacket + qty.pieces;

            stockCheckPromises.push({
              product,
              quantity,
              check: this.stockService.checkStockAvailability(productId, quantity)
            });

            allocations.push({
              tripId: this.selectedTrip!.id!,
              product,
              quantity,
              allocatedBy: currentUser,
              allocatedAt: new Date(),
              sourceStockExpiry: ''
            });
          }
        }
      });

      // Check stock availability and get details
      const stockResults = await Promise.all(
        stockCheckPromises.map(async (item) => {
          const isAvailable = await item.check;
          const currentStock = await this.stockService.getStockQuantity(item.product.id);
          return {
            product: item.product,
            requested: item.quantity,
            available: currentStock,
            isAvailable
          };
        })
      );

      // Find products with insufficient stock
      const insufficientProducts = stockResults.filter(result => !result.isAvailable);

      if (insufficientProducts.length > 0) {
        this.insufficientStockProducts = insufficientProducts.map(p => ({
          name: p.product.name,
          requested: p.requested,
          available: p.available,
          product: p.product
        }));

        this.showInsufficientStockDialog = true;
        this.isSavingAllocation = false;
        return;
      }

      // All stock checks passed - proceed with allocation
      await Promise.all(
        allocations.map(async (allocation) => {
          // 1. Reduce stock and get which batches were used
          const usedExpiryDates = await this.stockService.reduceStock(
            allocation.product.id,
            allocation.quantity
          );

          // 2. Store the first (oldest) expiry date used
          allocation.sourceStockExpiry = usedExpiryDates[0];

          // 3. Create allocation record with expiry date
          await this.stockAllocationService.addAllocation(allocation);
        })
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: `${allocations.length} product(s) allocated successfully`
      });
      this.loadProducts();

      this.clearAllAllocations();
    } catch (error: any) {
      console.error('Error allocating stock:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to allocate stock'
      });
    } finally {
      this.isSavingAllocation = false;
    }
  }

  confirmDeleteAllocation(allocation: TripStockAllocation): void {
    this.confirmationService.confirm({
      message: `Delete allocation of ${allocation.product.name} (${this.formatAllocationQuantity(allocation.quantity, allocation.product)})?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAllocation(allocation)
    });
  }

  async deleteAllocation(allocation: TripStockAllocation): Promise<void> {
    this.isDeletingAllocation = true;

    try {
      // 1. Delete allocation record
      await this.stockAllocationService.deleteAllocation(allocation.id);

      // 2. Restore stock with the original expiry date
      await this.stockService.increaseStock(
        allocation.product.id,
        allocation.quantity,
        allocation.sourceStockExpiry || '',
        allocation.product
      );

      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Allocation removed and stock restored successfully'
      });
    } catch (error) {
      console.error('Error deleting allocation:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete allocation'
      });
    } finally {
      this.isDeletingAllocation = false;
    }
  }

  formatAllocationQuantity(quantity: number, product: Product): string {
    const { packets, pieces } = this.calculatePacketsAndPieces(
      quantity,
      product.piecesPerPacket
    );
    return pieces > 0 ? `${packets} + ${pieces} pcs` : `${packets}`;
  }

  calculatePacketsAndPieces(total: number, perPacket: number) {
    if (!perPacket || perPacket <= 1) {
      return { packets: total, pieces: 0 };
    }
    return {
      packets: Math.floor(total / perPacket),
      pieces: total % perPacket
    };
  }

  // convert Firestore Timestamp to Date
  toDate(timestamp: any): Date {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
  }

  getProductTotalValue(productId: string): number {
    const product = this.products.find(p => p.id === productId);
    if (!product) return 0;

    const qty = this.productQuantities.get(productId);
    if (!qty) return 0;

    // Calculate total value considering pieces
    let totalValue = 0;

    // Full packets value (packets * unitPrice)
    totalValue += qty.packets * product.unitPrice;

    // Pieces value (pieces * (unitPrice / piecesPerPacket))
    if (product.piecesPerPacket > 1 && qty.pieces > 0) {
      const pricePerPiece = product.unitPrice / product.piecesPerPacket;
      totalValue += qty.pieces * pricePerPiece;
    }

    return Math.round(totalValue * 100) / 100;
  }

  get grandTotalValue(): number {
    let total = 0;
    this.productQuantities.forEach((qty, productId) => {
      total += this.getProductTotalValue(productId);
    });
    return Math.round(total * 100) / 100;
  }


  getAllocationTotalValue(allocation: TripStockAllocation): number {
    const product = allocation.product;
    const quantity = allocation.quantity;

    // Calculate price per piece
    const pricePerPiece = product.unitPrice / product.piecesPerPacket;

    // Total value = quantity (in pieces) * price per piece
    return Math.round(quantity * pricePerPiece * 100) / 100;
  }


  get totalValue(): number {
    return this.allocations.reduce((sum, allocation) => {
      return sum + this.getAllocationTotalValue(allocation);
    }, 0);
  }

  formatQuantityDisplay(quantity: number, product: Product): string {
    const { packets, pieces } = this.calculatePacketsAndPieces(
      quantity,
      product.piecesPerPacket
    );

    if (product.piecesPerPacket > 1) {
      return pieces > 0 ? `${packets} packets + ${pieces} pcs` : `${packets} packets`;
    }
    return `${packets}`;
  }
}