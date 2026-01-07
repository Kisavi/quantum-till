// features/sales/sale-item/sale-item.component.ts

import { Component, input, inject, computed } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { StockItem } from '../../../core/models/stock-item';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-sale-item',
  imports: [CurrencyPipe, NgClass, ButtonModule],
  templateUrl: './sale-item.component.html',
})
export class SaleItemComponent {
  stockItem = input<StockItem>();
  private cartService = inject(CartService);

  // Get quantity of this item in cart
  cartQuantity = computed(() => {
    const item = this.stockItem();
    if (!item) return 0;
    
    const cartItem = this.cartService.getExistingItem(item.product.id);
    return cartItem?.quantity || 0;
  });

  // Calculate available stock (total - already in cart)
  availableStock = computed(() => {
    const item = this.stockItem();
    if (!item) return 0;
    
    return item.quantity - this.cartQuantity();
  });

  // Check if we can add more (at least 1 packet worth)
  canAddMore = computed(() => {
    const item = this.stockItem();
    if (!item) return false;
    
    const piecesPerPacket = item.product.piecesPerPacket || 1;
    return this.availableStock() >= piecesPerPacket;
  });

  // Check if item is in cart
  isInCart = computed(() => this.cartQuantity() > 0);

  addToCart(): void {
    const item = this.stockItem();
    if (!item || !this.canAddMore()) return;
    
    // Add one full packet worth
    const piecesPerPacket = item.product.piecesPerPacket || 1;
    
    // Add the packet to cart
    for (let i = 0; i < piecesPerPacket; i++) {
      this.cartService.addItem(item);
    }
  }

  removeFromCart(): void {
    const item = this.stockItem();
    if (!item) return;
    
    // Remove one full packet worth
    const piecesPerPacket = item.product.piecesPerPacket || 1;
    
    for (let i = 0; i < piecesPerPacket; i++) {
      this.cartService.decrementItem(item.product.id);
    }
  }

  formatQuantity(quantity: number | undefined, product: any): string {
    if (!product || !product.piecesPerPacket || product.piecesPerPacket <= 1) {
      // Products without pieces - always show as packets
      return `${quantity} ${quantity === 1 ? 'pkt' : 'pkts'}`;
    }

    const packets = Math.floor(quantity! / product.piecesPerPacket);
    const pieces = quantity! % product.piecesPerPacket;

    if (packets === 0 && pieces === 0) return '0';
    if (packets === 0) return `${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
    if (pieces === 0) return `${packets} ${packets === 1 ? 'pkt' : 'pkts'}`;

    return `${packets} ${packets === 1 ? 'pkt' : 'pkts'} + ${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
  }
}