// features/sales/sell/sell.component.ts

import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonDirective } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { ActivatedRoute } from '@angular/router';
import { from, map, Observable } from 'rxjs';

import { CartService } from '../../../core/services/cart.service';
import { StockService } from '../../../core/services/stock.service';
import { TripStockCalculatorService } from '../../../core/services/trip-stock-calculator.service';
import { CartComponent } from '../cart/cart.component';
import { SaleItemComponent } from '../sale-item/sale-item.component';
import { StockItem } from '../../../core/models/stock-item';

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
export class SellComponent implements OnInit {
  private stockService = inject(StockService);
  private cartService = inject(CartService);
  private tripStockCalculator = inject(TripStockCalculatorService);
  private route = inject(ActivatedRoute);

  tripId: string | null = null;
  stock$!: Observable<StockItem[]>;

  cart = this.cartService.items;
  mobileCartVisible = false;

  ngOnInit(): void {
    this.tripId = this.route.snapshot.queryParams['tripId'];
    
    if (this.tripId) {
      // Trip stock - filter out zero-stock items
      this.stock$ = from(this.tripStockCalculator.getTripStockItems(this.tripId)).pipe(
        map(items => items.filter(item => item.quantity > 0))
      );
    } else {
      // Regular stock - filter out zero-stock items
      this.stock$ = this.stockService.getStockItems().pipe(
        map(items => items.filter(item => item.quantity > 0))
      );
    }
  }

  addTocart(product: any) {
    this.cartService.addItem(product);
  }

  revealMobileCart() {
    this.mobileCartVisible = true;
  }
}