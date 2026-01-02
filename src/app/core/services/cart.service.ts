import { computed, Injectable, signal } from '@angular/core';
import { CartItem } from '../models/cart-item';
import { ProductStock } from '../models/product-stock';

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

  addItem(stockItem: ProductStock): void {
    if (stockItem.quantity <= 0) {
      return;
    }

    // Check if item already exists in cart
    const existingItem = this.getExistingItem(stockItem.product.id);

    // If it exists, increase quantity by 1
    if (existingItem) {
      if (existingItem.quantity >= stockItem.quantity) {
        // Prevent exceeding stock quantity
        return;
      }
      existingItem.quantity += 1;
      this.items.update((items) => [...items]); // Update signal
      return;
    }

    // If it doesn't exist, add new item
    const cartItem: CartItem = { stockItem: stockItem, quantity: 1 };
    this.items.update((items) => [...items, cartItem]);
  }

  decreaseQuantity(stockItem: ProductStock): void {
    const existingItem = this.getExistingItem(stockItem.product.id);

    if (!existingItem) {
      return;
    }

    if (existingItem.quantity <= 1) {
      this.removeItem(existingItem);
      return;
    }


    existingItem.quantity -= 1;
    console.log("decreasing...", existingItem.quantity);
    this.items.update((items) => [...items]); // Update signal
  }

  removeItem(item: CartItem): void {
    this.items.update((items) => items.filter((cartItem) => cartItem !== item));
  }

  clearCart(): void {
    this.items.update(() => []);
  }
}
