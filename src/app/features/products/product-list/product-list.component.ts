import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { ProductService } from '../../../core/services/product.service';
import { ProductAddComponent } from '../product-add/product-add.component';
import { Product } from '../../../core/models/product';

@Component({
  selector: 'app-product-list',
  imports: [ProductAddComponent, Toast, ConfirmDialog, Button, Card, AsyncPipe, TableModule],
  templateUrl: './product-list.component.html',
  providers: [MessageService, ConfirmationService],
})
export class ProductListComponent {
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  products$ = this.productService.getProducts();
  dialogVisible = false;

  openDialog(): void {
    this.dialogVisible = true;
  }

  async deleteProduct(product: Product): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `Delete ${product.name}`,
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
          await this.productService.deleteProduct(product.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Product deleted',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete product',
          });
          console.error(e);
        }
      },
    });
  }
}
