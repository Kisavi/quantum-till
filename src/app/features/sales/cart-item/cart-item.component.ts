import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CartItem } from '../../../core/models/cart-item';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-cart-item',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './cart-item.component.html',
})
export class CartItemComponent {
  private cartService = inject(CartService);

  cartItem = input.required<CartItem>();
  quantity = new FormControl();

  constructor() {
    effect(() => {
      this.quantity.setValue(this.cartItem().quantity, { emitEvent: false });
    });
  }

  setQuantity(quantity: number): void {
    if (quantity < 1) return;
    this.cartItem().quantity = quantity;
    this.cartService.items.update((items) => [...items]); // Update signal
  }

  remove(item: CartItem): void {
    this.cartService.removeItem(item);
  }
}
