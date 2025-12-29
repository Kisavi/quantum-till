import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';
import { SaleItemComponent } from '../sale-item/sale-item.component';
import { CartComponent } from '../cart/cart.component';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-sell',
  imports: [ReactiveFormsModule, AsyncPipe, SaleItemComponent, CartComponent, Button],
  templateUrl: './sell.component.html',
})
export class SellComponent {
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  products$ = this.productService.getProducts();

  cart = this.cartService.items;

  search = new FormControl('');

  addTocart(product: any) {
    this.cartService.addItem(product);
  }

  revealMobileCart() {
    //
  }
}
