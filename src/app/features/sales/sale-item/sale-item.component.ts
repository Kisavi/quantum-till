import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { ProductStock } from '../../../core/models/product-stock';
import { CartService } from '../../../core/services/cart.service';
import { ButtonDirective } from "primeng/button";

@Component({
  selector: 'app-sale-item',
  imports: [CurrencyPipe, NgClass, ButtonDirective],
  templateUrl: './sale-item.component.html',
})
export class SaleItemComponent {
  productStockItem = input.required<ProductStock>();

  private cartService = inject(CartService);

  cartItem = computed(() =>
    this.cartService.getExistingItem(this.productStockItem().product.id)
  );

  increaseQuantity() {
    this.cartService.addItem(this.productStockItem());
  }

  decreaseQuantity() {
    this.cartService.decreaseQuantity(this.productStockItem());
  }
}
