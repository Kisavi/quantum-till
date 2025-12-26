import { AsyncPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Product } from '../../../core/models/product';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-add',
  imports: [Toast, Dialog, InputText, Button, ReactiveFormsModule],
  templateUrl: './product-add.component.html',
  providers: [MessageService],
})
export class ProductAddComponent {
  private productService = inject(ProductService);
  private messageService = inject(MessageService);

  visible = input(false);
  visibleChange = output<boolean>();

  saving = false;

  productForm = new FormGroup({
    name: new FormControl(),
    unitPrice: new FormControl(),
    shelfLife: new FormControl(),
    weight: new FormControl(),
    piecesPerPacket: new FormControl(1),
  });

  async save(): Promise<void> {
    this.saving = true;
    const product = this.productForm.value as Product;

    try {
      await this.productService.addProduct(product);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Product added',
      });
      this.closeDialog();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Adding product failed',
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  closeDialog(): void {
    this.productForm.reset();
    this.visibleChange.emit(false);
  }
}
