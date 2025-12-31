import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { StockItem } from '../../../core/models/stock-item';
import { StockService } from '../../../core/services/stock.service';
import { StockAddComponent } from '../stock-add/stock-add.component';

@Component({
  selector: 'app-stock-list',
  imports: [
    Toast,
    ConfirmDialog,
    Button,
    Card,
    TableModule,
    StockAddComponent,
    AsyncPipe,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './stock-list.component.html',
  providers: [MessageService, ConfirmationService],
})
export class StockListComponent {
  private stockService = inject(StockService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  stock$ = this.stockService.getStockItems();
  dialogVisible = false;

  openDialog(): void {
    this.dialogVisible = true;
  }

  async deleteStockItem(item: StockItem): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `Remove ${item.product.name} stock`,
      closable: true,
      closeOnEscape: true,
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Continue',
        severity: 'danger',
      },
      accept: async () => {
        try {
          await this.stockService.deleteStockItem(item.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Stock removed',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to remove stock',
          });
          console.error(e);
        }
      },
    });
  }
}
