import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { Button, ButtonDirective } from 'primeng/button';

@Component({
  selector: 'app-cart',
  imports: [CartItemComponent, CurrencyPipe, Button, ButtonDirective],
  templateUrl: './cart.component.html',
})
export class CartComponent {
  private cartService = inject(CartService);

  cart = this.cartService.items;
  subTotal = this.cartService.subTotal;

  clear() {
    this.cartService.clearCart();
  }

  checkout() {
    // Checkout logic here
  }
}
