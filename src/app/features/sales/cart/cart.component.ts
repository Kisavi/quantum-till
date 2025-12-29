import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item.component';
import { Button, ButtonDirective } from 'primeng/button';
import { CheckoutComponent } from '../checkout/checkout.component';

@Component({
  selector: 'app-cart',
  imports: [CartItemComponent, CurrencyPipe, Button, ButtonDirective, CheckoutComponent],
  templateUrl: './cart.component.html',
})
export class CartComponent {
  private cartService = inject(CartService);

  cart = this.cartService.items;
  subTotal = this.cartService.subTotal;

  checkoutDialogVisible = false;

  clear() {
    this.cartService.clearCart();
  }

  checkout() {
    this.checkoutDialogVisible = true;
  }
}
