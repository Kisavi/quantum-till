import { Component, input } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';
import { ProductStock } from '../../../core/models/product-stock';

@Component({
  selector: 'app-sale-item',
  imports: [CurrencyPipe, NgClass],
  templateUrl: './sale-item.component.html',
})
export class SaleItemComponent {
  productStockItem = input<ProductStock>();
}
