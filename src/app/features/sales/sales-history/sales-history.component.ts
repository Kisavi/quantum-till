import { AsyncPipe, CurrencyPipe, DatePipe, JsonPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { Sale } from '../../../core/models/sale';
import { SaleService } from '../../../core/services/sale.service';
import { SaleDetailsComponent } from '../sale-details/sale-details.component';
import { Badge } from 'primeng/badge';
@Component({
  selector: 'app-sales-history',
  imports: [
    Toast,
    ConfirmDialog,
    Button,
    Card,
    AsyncPipe,
    TableModule,
    SaleDetailsComponent,
    Badge,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './sales-history.component.html',
  providers: [MessageService, ConfirmationService],
})
export class SalesHistoryComponent {
  private saleService = inject(SaleService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  sales$ = this.saleService.getSales();

  dialogVisible = false;
  sale?: Sale;

  viewSale(sale: Sale): void {
    this.dialogVisible = true;
    this.sale = sale;
  }

  async deleteSale(sale: Sale): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `Delete Sale`,
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
          await this.saleService.deleteSale(sale.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Sale deleted',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete sale',
          });
          console.error(e);
        }
      },
    });
  }
}
