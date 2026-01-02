import { Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { Product } from '../../../core/models/product';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-add',
  imports: [Toast, Dialog, InputText, ButtonDirective, ReactiveFormsModule],
  templateUrl: './product-add.component.html',
  providers: [MessageService],
})
export class ProductAddComponent {
  private productService = inject(ProductService);
  private messageService = inject(MessageService);

  visible = input(false);
  product = input<Product | null>(null);
  close = output();

  title!: string;
  saving = false;

  productForm = new FormGroup({
    name: new FormControl(),
    unitPrice: new FormControl(),
    shelfLife: new FormControl(),
    weight: new FormControl(),
    piecesPerPacket: new FormControl(1),
  });

  constructor() {
    effect(() => {
      const product = this.product();
      this.title = product?.id ? 'Edit Product' : 'Add Product';

      if (product) {
        this.productForm.patchValue(product);
      }
    });
  }

  async save(): Promise<void> {
    this.saving = true;
    let message;
    const product = this.productForm.value as Product;

    try {
      if (this.product()) {
        await this.productService.updateProduct(this.product()!.id, product);
        message = 'Product updated';
      } else {
        await this.productService.addProduct(product);
        message = 'Product added';
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: message,
      });
      this.closeDialog();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: (e as Error).message,
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  closeDialog(): void {
    this.productForm.reset();
    this.close.emit();
  }
}
