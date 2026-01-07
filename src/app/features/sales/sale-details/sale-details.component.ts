import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { Sale } from '../../../core/models/sale';
import { CartItem } from '../../../core/models/cart-item';

@Component({
  selector: 'app-sale-details',
  imports: [Button, Toast, Dialog, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './sale-details.component.html',
})
export class SaleDetailsComponent {
  sale = input<Sale>();
  visible = input(false);
  visibleChange = output<boolean>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }

    formatQuantity(quantity: number, product: any): string {
    if (!product || !product.piecesPerPacket || product.piecesPerPacket <= 1) {
      return `${quantity} ${quantity === 1 ? 'pkt' : 'pkts'}`;
    }

    const packets = Math.floor(quantity / product.piecesPerPacket);
    const pieces = quantity % product.piecesPerPacket;

    if (packets === 0 && pieces === 0) return '0';
    if (packets === 0) return `${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
    if (pieces === 0) return `${packets} ${packets === 1 ? 'pkt' : 'pkts'}`;

    return `${packets} ${packets === 1 ? 'pkt' : 'pkts'} + ${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
  }

  getItemTotalValue(item: CartItem): number {
    const pricePerPiece = item.stockItem.product.unitPrice / item.stockItem.product.piecesPerPacket;
    return Math.round(item.quantity * pricePerPiece * 100) / 100;
  }
}
