import { AsyncPipe, formatDate } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { StockItem } from '../../../core/models/stock-item';
import { ProductService } from '../../../core/services/product.service';
import { StockService } from '../../../core/services/stock.service';
import { Product } from '../../../core/models/product';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stock-add',
  standalone: true,
  imports: [CommonModule, Toast, Dialog, Button, ReactiveFormsModule, AsyncPipe, Select, InputText],
  templateUrl: './stock-add.component.html',
})
export class StockAddComponent {
  private productService = inject(ProductService);
  private stockService = inject(StockService);
  private messageService = inject(MessageService);

  visible = input(false);
  visibleChange = output<boolean>();

  saving = false;
  products$ = this.productService.getProducts();
  showPiecesInput = false;
  selectedProduct: Product | null = null;

  stockForm = new FormGroup({
    product: new FormControl(null, Validators.required),
    manufactureDate: new FormControl('', Validators.required),
    packets: new FormControl(0, [Validators.required, Validators.min(0)]),
    pieces: new FormControl(0, Validators.min(0)),
  });

  onProductChange(product: Product): void {
    this.selectedProduct = product;
    this.showPiecesInput = product && product.piecesPerPacket > 1;
    
    if (!this.showPiecesInput) {
      this.stockForm.patchValue({ pieces: 0 });
    } else {
      // Add max validator for pieces
      const piecesControl = this.stockForm.get('pieces');
      piecesControl?.setValidators([
        Validators.min(0),
        Validators.max(product.piecesPerPacket - 1)
      ]);
      piecesControl?.updateValueAndValidity();
    }
  }

  // Get max pieces allowed
  getMaxPieces(): number {
    return this.selectedProduct ? this.selectedProduct.piecesPerPacket - 1 : 0;
  }

  async save(): Promise<void> {
    if (this.stockForm.invalid || !this.selectedProduct) return;

    this.saving = true;

    const formValue = this.stockForm.value;
    
    // Convert packets + pieces to total quantity
    const totalQuantity = this.convertToTotalQuantity(
      formValue.packets || 0,
      formValue.pieces || 0,
      this.selectedProduct
    );

    // Calculate expiry date
    const expiryDate = formatDate(
      new Date(formValue.manufactureDate!).getTime() + this.selectedProduct.shelfLife * 86400000,
      'yyyy-MM-dd',
      'en-US',
    );

    const stockItem: StockItem = {
      id: '',
      product: this.selectedProduct,
      manufactureDate: formValue.manufactureDate!,
      expiryDate: expiryDate,
      quantity: totalQuantity, // Store as total pieces
    };

    try {
      await this.stockService.addStockItem(stockItem);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Stock recorded successfully',
      });
      this.closeDialog();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Recording stock failed',
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  // convert packets + pieces to total quantity
  convertToTotalQuantity(packets: number, pieces: number, product: Product): number {
    return (packets * product.piecesPerPacket) + pieces;
  }

  // Format quantity display (for preview)
  formatQuantityDisplay(packets: number, pieces: number): string {
    if (!this.selectedProduct) return '';
    
    if (this.selectedProduct.piecesPerPacket > 1) {
      if (packets === 0 && pieces === 0) return '0';
      if (packets === 0) return `${pieces} piece${pieces > 1 ? 's' : ''}`;
      if (pieces === 0) return `${packets} packet${packets > 1 ? 's' : ''}`;
      return `${packets} packet${packets > 1 ? 's' : ''} + ${pieces} piece${pieces > 1 ? 's' : ''}`;
    }
    
    return `${packets}`;
  }

  // Break down total quantity into packets + pieces
  calculatePacketsAndPieces(total: number, piecesPerPacket: number): { packets: number; pieces: number } {
    if (!piecesPerPacket || piecesPerPacket <= 1) {
      return { packets: total, pieces: 0 };
    }
    return {
      packets: Math.floor(total / piecesPerPacket),
      pieces: total % piecesPerPacket
    };
  }

  closeDialog(): void {
    this.stockForm.reset();
    this.selectedProduct = null;
    this.showPiecesInput = false;
    this.visibleChange.emit(false);
  }
}