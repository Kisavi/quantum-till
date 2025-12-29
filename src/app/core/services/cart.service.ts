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
      .map((item) => item.stockItem.product.unitPrice * item.quantity)
      .reduce((acc, curr) => acc + curr, 0);
  });

  getExistingItem(productId: string): CartItem | undefined {
    return this.items().find((cartItem) => cartItem.stockItem.product.id === productId);
  }

  addItem(item: StockItem): void {
    // Check if item already exists in cart
    const existingItem = this.getExistingItem(item.product.id);

    // If it exists, increase quantity by 1
    if (existingItem) {
      existingItem.quantity += 1;
      return;
    }

    // If it doesn't exist, add new item
    const cartItem: CartItem = { stockItem: item, quantity: 1 };
    this.items.update((items) => [...items, cartItem]);
  }

  removeItem(item: CartItem): void {
    this.items.update((items) => items.filter((cartItem) => cartItem !== item));
  }

  clearCart(): void {
    this.items.update(() => []);
  }
}
