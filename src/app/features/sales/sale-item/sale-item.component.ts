import { Component, input } from '@angular/core';
import { StockItem } from '../../../core/models/stock-item';
import { CurrencyPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-sale-item',
  imports: [CurrencyPipe, NgClass],
  templateUrl: './sale-item.component.html',
})
export class SaleItemComponent {
  stockItem = input<StockItem>();
}
