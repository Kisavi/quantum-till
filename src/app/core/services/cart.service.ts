// core/services/cart.service.ts

import { computed, Injectable, signal } from '@angular/core';
import { CartItem } from '../models/cart-item';
import { StockItem } from '../models/stock-item';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  items = signal<CartItem[]>([]);

subTotal = computed(() => {
  return this.items()
    .map((item) => {
      // Calculate price per piece
      const pricePerPiece = item.stockItem.product.unitPrice / item.stockItem.product.piecesPerPacket;
      // Total = quantity (in pieces) × price per piece
      return item.quantity * pricePerPiece;
    })
    .reduce((acc, curr) => acc + curr, 0);
});

  getExistingItem(productId: string): CartItem | undefined {
    return this.items().find((cartItem) => cartItem.stockItem.product.id === productId);
  }

  addItem(item: StockItem): void {
    if (item.quantity <= 0) {
      return;
    }

    // Check if item already exists in cart
    const existingItem = this.getExistingItem(item.product.id);

    if (existingItem) {
      // Don't exceed available stock
      if (existingItem.quantity < item.quantity) {
        // Hre, I Create new array to trigger signal update
        this.items.update((items) => 
          items.map((cartItem) => 
            cartItem.stockItem.product.id === item.product.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        );
      }
      return;
    }

    // If it doesn't exist, add new item
    const cartItem: CartItem = { stockItem: item, quantity: 1 };
    this.items.update((items) => [...items, cartItem]);
  }

  // Decrement item quantity or remove if quantity becomes 0
  decrementItem(productId: string): void {
    const existingItem = this.getExistingItem(productId);
    
    if (!existingItem) return;

    if (existingItem.quantity > 1) {
      // Decrease quantity - create new array to trigger signal update
      this.items.update((items) => 
        items.map((cartItem) => 
          cartItem.stockItem.product.id === productId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        )
      );
    } else {
      // Remove item from cart
      this.items.update((items) => 
        items.filter((item) => item.stockItem.product.id !== productId)
      );
    }
  }

  removeItem(item: CartItem): void {
    this.items.update((items) => items.filter((cartItem) => cartItem !== item));
  }

  clearCart(): void {
    this.items.update(() => []);
  }
}