// features/sales/cart/cart.component.ts

import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { CartItem } from '../../../core/models/cart-item';
import { Button, ButtonDirective } from 'primeng/button';
import { CheckoutComponent } from '../checkout/checkout.component';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, Button, ButtonDirective, CheckoutComponent],
  templateUrl: './cart.component.html',
})
export class CartComponent {
  private cartService = inject(CartService);

  cart = this.cartService.items;
  subTotal = this.cartService.subTotal;

  checkoutDialogVisible = false;
  tripId = input<string | null>(null);

  clear() {
    this.cartService.clearCart();
  }

  removeItem(item: CartItem) {
    this.cartService.removeItem(item);
  }

  checkout() {
    this.checkoutDialogVisible = true;
  }

  // Format quantity to show packets only (not pieces)
  formatQuantity(quantity: number, product: any): string {
    if (!product || !product.piecesPerPacket || product.piecesPerPacket <= 1) {
      // Products without pieces
      return `${quantity} ${quantity === 1 ? 'pkt' : 'pkts'}`;
    }

    // Products with pieces - show as packets
    const packets = Math.floor(quantity / product.piecesPerPacket);
    const pieces = quantity % product.piecesPerPacket;

    if (packets === 0 && pieces === 0) return '0';
    if (packets === 0) return `${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
    if (pieces === 0) return `${packets} ${packets === 1 ? 'pkt' : 'pkts'}`;

    return `${packets} ${packets === 1 ? 'pkt' : 'pkts'} + ${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
  }

  // Calculate item total value considering price per piece
  getItemTotalValue(item: CartItem): number {
    const pricePerPiece = item.stockItem.product.unitPrice / item.stockItem.product.piecesPerPacket;
    return Math.round(item.quantity * pricePerPiece * 100) / 100;
  }
}