// core/services/trip-stock-calculator.service.ts

import { Injectable, inject } from '@angular/core';
import { Firestore, collection, query, where, getDocs } from '@angular/fire/firestore';
import { StockService } from './stock.service';
import { TripStockAllocation } from '../models/trip-stock-allocation';
import { Sale } from '../models/sale';
import { ReturnItem } from '../models/return-item';
import { StockItem } from '../models/stock-item';

export interface ProductStockCalculation {
  productId: string;
  quantity: number;
  expiryDate: string | undefined;
  product: any;
}

@Injectable({
  providedIn: 'root'
})
export class TripStockCalculatorService {
  private firestore = inject(Firestore);
  private stockService = inject(StockService);

  /**
   * Get available stock items for a trip (for selling)
   */
  async getTripStockItems(tripId: string): Promise<StockItem[]> {
    const remainingStock = await this.calculateRemainingTripStock(tripId);
    const stockItems: StockItem[] = [];

    // Get allocations to get full allocation data
    const allocationsSnapshot = await getDocs(
      query(
        collection(this.firestore, 'tripStockAllocations'),
        where('tripId', '==', tripId)
      )
    );

    const allocationsMap = new Map<string, TripStockAllocation>();
  allocationsSnapshot.forEach(doc => {
    const allocation = { 
      id: doc.id,  
      ...doc.data() 
    } as TripStockAllocation;
    allocationsMap.set(allocation.product.id, allocation);
  });

    // Convert remaining stock to StockItems
  remainingStock.forEach((stock, productId) => {
    if (stock.quantity > 0) {
      const allocation = allocationsMap.get(productId);
      
      if (allocation && allocation.id) { 
        stockItems.push({
          id: `${allocation.id}_${stock.expiryDate}`, 
          product: allocation.product,
          quantity: stock.quantity,
          expiryDate: stock.expiryDate || '',
          manufactureDate: '',
        });
      }
    }
  });

    return stockItems;
  }

  /**
   * Calculate remaining stock for a trip
   * Formula: Allocated - Sold - Replacements + UNSOLD Returns
   */
  async calculateRemainingTripStock(tripId: string): Promise<Map<string, ProductStockCalculation>> {
    
    // 1. Get all allocations for this trip
    const allocationsSnapshot = await getDocs(
      query(
        collection(this.firestore, 'tripStockAllocations'),
        where('tripId', '==', tripId)
      )
    );

    // 2. Get all sales for this trip
    const salesSnapshot = await getDocs(
      query(
        collection(this.firestore, 'sales'),
        where('tripId', '==', tripId),
        where('status', '==', 'COMPLETED')
      )
    );

    // 3. Get all returns for this trip
    const returnsSnapshot = await getDocs(
      query(
        collection(this.firestore, 'returns'),
        where('tripId', '==', tripId)
      )
    );

    // 4. Calculate remaining stock per product
    const remainingStock = new Map<string, ProductStockCalculation>();

    // Initialize with allocations
    allocationsSnapshot.forEach(doc => {
      const allocation = doc.data() as TripStockAllocation;
      remainingStock.set(allocation.product.id, {
        productId: allocation.product.id,
        quantity: allocation.quantity,
        expiryDate: allocation.sourceStockExpiry,
        product: allocation.product
      });
    });

    // Subtract sales
    salesSnapshot.forEach(doc => {
      const sale = doc.data() as Sale;
      sale.items?.forEach((item) => {
        const productId = item.stockItem.product.id;
        const stock = remainingStock.get(productId);
        if (stock) {
          stock.quantity -= item.quantity;
        }
      });
    });

    // Handle returns
    returnsSnapshot.forEach(doc => {
      const returnItem = doc.data() as ReturnItem;
      const stock = remainingStock.get(returnItem.product.id);
      
      if (stock) {
        if (returnItem.reason === 'UNSOLD') {
          // Unsold: Add back to remaining stock
          stock.quantity += returnItem.quantity;
        } else {
          // Damaged/Expired/Spoilt: Replacement was given, subtract from stock
          stock.quantity -= returnItem.quantity;
        }
      }
    });

    return remainingStock;
  }

  /**
   * Return remaining trip stock to warehouse
   */
  async returnStockToWarehouse(remainingStock: Map<string, ProductStockCalculation>): Promise<void> {
    const restorePromises: Promise<void>[] = [];

    remainingStock.forEach(stock => {
      if (stock.quantity > 0 && stock.expiryDate) {
        restorePromises.push(
          this.stockService.increaseStock(
            stock.productId,
            stock.quantity,
            stock.expiryDate,
            stock.product
          )
        );
      }
    });

    await Promise.all(restorePromises);
  }
}