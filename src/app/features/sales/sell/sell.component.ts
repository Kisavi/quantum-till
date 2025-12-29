import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { CartService } from '../../../core/services/cart.service';
import { StockService } from '../../../core/services/stock.service';
import { CartComponent } from '../cart/cart.component';
import { SaleItemComponent } from '../sale-item/sale-item.component';

@Component({
  selector: 'app-sell',
  imports: [
    ReactiveFormsModule,
    AsyncPipe,
    SaleItemComponent,
    CartComponent,
    ButtonDirective,
    Drawer,
  ],
  templateUrl: './sell.component.html',
})
export class SellComponent {
  private stockService = inject(StockService);
  private cartService = inject(CartService);

  stock$ = this.stockService.getStockItems();

  cart = this.cartService.items;
  mobileCartVisible = false;

  addTocart(product: any) {
    this.cartService.addItem(product);
  }

  revealMobileCart() {
    this.mobileCartVisible = true;
  }
}
