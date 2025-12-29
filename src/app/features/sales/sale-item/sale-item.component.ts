import { Component, input } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { StockItem } from '../../../core/models/stock-item';

@Component({
  selector: 'app-sale-item',
  imports: [CurrencyPipe, NgClass],
  templateUrl: './sale-item.component.html',
})
export class SaleItemComponent {
  stockItem = input<StockItem>();
}
