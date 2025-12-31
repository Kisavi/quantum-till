import { AsyncPipe, formatDate } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { StockItem } from '../../../core/models/stock-item';
import { ProductService } from '../../../core/services/product.service';
import { StockService } from '../../../core/services/stock.service';

@Component({
  selector: 'app-stock-add',
  imports: [Toast, Dialog, Button, ReactiveFormsModule, AsyncPipe, Select, InputText],
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

  stockForm = new FormGroup({
    product: new FormControl(),
    manufactureDate: new FormControl(),
    quantity: new FormControl(),
  });

  async save(): Promise<void> {
    this.saving = true;
    const stockItem = this.stockForm.value as StockItem;
    stockItem.expiryDate = formatDate(
      new Date(stockItem.manufactureDate).getTime() + stockItem.product.shelfLife * 86400000,
      'yyyy-MM-dd',
      'en-US',
    );

    try {
      await this.stockService.addStockItem(stockItem);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Stock recorded',
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

  closeDialog(): void {
    this.stockForm.reset();
    this.visibleChange.emit(false);
  }
}
