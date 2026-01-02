import { AsyncPipe, DatePipe, DecimalPipe, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button, ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { Toast } from 'primeng/toast';
import { StockRecord } from '../../../core/models/stock-record';
import { StockService } from '../../../core/services/stock.service';
import { StockAddComponent } from '../stock-add/stock-add.component';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-stock-list',
  imports: [
    Toast,
    ConfirmDialog,
    Card,
    TableModule,
    StockAddComponent,
    AsyncPipe,
    DatePipe,
    DecimalPipe,
    TabsModule,
    ButtonDirective,
    Tooltip,
  ],
  templateUrl: './stock-list.component.html',
  providers: [MessageService, ConfirmationService],
})
export class StockListComponent {
  private stockService = inject(StockService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  productStock$ = this.stockService.getProductStock();
  stockRecords$ = this.stockService.getStockRecords();
  dialogVisible = false;

  openDialog(): void {
    this.dialogVisible = true;
  }

  async deleteStockRecord(record: StockRecord): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `Remove stock record for ${record.product.name}`,
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
          await this.stockService.deleteStockRecord(record.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Stock record deleted',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: (e as Error).message,
          });
          console.error(e);
        }
      },
    });
  }
}
