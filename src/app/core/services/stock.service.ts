import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  CollectionReference,
  doc,
  Firestore,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ProductStock } from '../models/product-stock';
import { StockRecord } from '../models/stock-record';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private firestore = inject(Firestore);

  public stockRecordsCollRef = collection(
    this.firestore,
    'stock-records',
  ) as CollectionReference<StockRecord>;

  public productStockCollRef = collection(
    this.firestore,
    'stock',
  ) as CollectionReference<ProductStock>;

  getProductStock(): Observable<ProductStock[]> {
    return collectionData(this.productStockCollRef);
  }

  getStockRecords(): Observable<StockRecord[]> {
    return collectionData(this.stockRecordsCollRef);
  }

  addStockRecord(stockRecord: StockRecord): Promise<void> {
    return runTransaction(this.firestore, async (transaction) => {
      const productStockDocRef = doc(this.productStockCollRef, stockRecord.product.id);
      const productStockDoc = await transaction.get(productStockDocRef);

      if (productStockDoc.exists()) {
        // Increase existing stock quantity
        const existingStock = productStockDoc.data() as ProductStock;
        const newQuantity = existingStock.quantity + stockRecord.quantity;
        transaction.update(productStockDocRef, { quantity: newQuantity });
      } else {
        // Create new stock entry
        const newProductStock: ProductStock = {
          id: stockRecord.product.id,
          product: stockRecord.product,
          quantity: stockRecord.quantity,
        };
        transaction.set(productStockDocRef, newProductStock);
      }

      // Add stock record
      const stockRecordDocRef = doc(this.stockRecordsCollRef);
      stockRecord.id = stockRecordDocRef.id;
      stockRecord.adjustedOn = serverTimestamp() as Timestamp;
      transaction.set(stockRecordDocRef, stockRecord);
    });
  }

  deleteStockRecord(id: string): Promise<void> {
    return runTransaction(this.firestore, async (transaction) => {
      const stockRecordDocRef = doc(this.stockRecordsCollRef, id);
      const stockRecordDoc = await transaction.get(stockRecordDocRef);

      if (!stockRecordDoc.exists()) {
        throw new Error('Stock record does not exist');
      }

      const stockRecord = stockRecordDoc.data() as StockRecord;
      const productStockDocRef = doc(this.productStockCollRef, stockRecord.product.id);
      const productStockDoc = await transaction.get(productStockDocRef);

      if (productStockDoc.exists()) {
        // Decrease existing stock quantity
        const existingStock = productStockDoc.data() as ProductStock;
        const newQuantity = existingStock.quantity - stockRecord.quantity;
        transaction.update(productStockDocRef, { quantity: newQuantity });
      }

      // Delete stock record
      transaction.delete(stockRecordDocRef);
    });
  }
}
