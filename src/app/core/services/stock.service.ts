import { inject, Injectable } from '@angular/core';
import {
  collection,
  collectionData,
  CollectionReference,
  deleteDoc,
  doc,
  Firestore,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
} from '@angular/fire/firestore';
import { StockItem } from '../models/stock-item';
import { Observable } from 'rxjs';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  private firestore = inject(Firestore);

  public stockCollRef = collection(this.firestore, 'stock-items') as CollectionReference<StockItem>;

  getStockItems(): Observable<StockItem[]> {
    return collectionData(this.stockCollRef);
  }

  addStockItem(stockItem: StockItem): Promise<void> {
    const docRef = doc(this.stockCollRef);
    stockItem.id = docRef.id;
    return setDoc(docRef, stockItem);
  }

  updateStockItem(id: string, stockItem: Partial<StockItem>): Promise<void> {
    const docRef = doc(this.stockCollRef, id);
    return updateDoc(docRef, stockItem);
  }

  deleteStockItem(id: string): Promise<void> {
    const docRef = doc(this.stockCollRef, id);
    return deleteDoc(docRef);
  }

  // Get all stock items for a product, sorted by expiry date (FIFO)
  private async getStockItemsForProduct(productId: string): Promise<{ id: string; data: StockItem }[]> {
    const q = query(
      this.stockCollRef,
      where('product.id', '==', productId),
      orderBy('expiryDate', 'asc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data() as StockItem
    }));
  }

  // Find stock item by product ID and exact expiry date
  private async getStockItemByExpiryDate(
    productId: string,
    expiryDate: string
  ): Promise<{ id: string; data: StockItem } | null> {
    const q = query(
      this.stockCollRef,
      where('product.id', '==', productId),
      where('expiryDate', '==', expiryDate)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      data: doc.data() as StockItem
    };
  }

  // Reduce stock across multiple batches if needed (FIFO)
  async reduceStock(productId: string, quantity: number): Promise<string[]> {
    const stockItems = await this.getStockItemsForProduct(productId);

    if (stockItems.length === 0) {
      throw new Error(`No stock found for product ID: ${productId}`);
    }

    const totalAvailable = stockItems.reduce((sum, item) => sum + item.data.quantity, 0);

    if (totalAvailable < quantity) {
      throw new Error(
        `Insufficient stock for ${stockItems[0].data.product.name}. ` +
        `Available: ${totalAvailable}, Requested: ${quantity}`
      );
    }

    let remainingToReduce = quantity;
    const usedExpiryDates: string[] = []; // Track which batches were used

    for (const stockItem of stockItems) {
      if (remainingToReduce <= 0) break;

      const currentQuantity = stockItem.data.quantity;
      const toReduceFromThisBatch = Math.min(remainingToReduce, currentQuantity);
      const newQuantity = currentQuantity - toReduceFromThisBatch;

      const docRef = doc(this.stockCollRef, stockItem.id);
      await updateDoc(docRef, { quantity: newQuantity });

      // Track this batch's expiry date
      usedExpiryDates.push(stockItem.data.expiryDate);

      remainingToReduce -= toReduceFromThisBatch;
    }

    return usedExpiryDates; // rtns an arr of expiry dates used
  }

  // adds to existing batch or creates new one based on expiry date
  async increaseStock(
    productId: string,
    quantity: number,
    expiryDate: string,
    product?: Product
  ): Promise<void> {
    // Try to find existing batch with same expiry date
    const existingBatch = await this.getStockItemByExpiryDate(productId, expiryDate);

    if (existingBatch) {
      // Add to existing batch with same expiry date
      const newQuantity = existingBatch.data.quantity + quantity;
      const docRef = doc(this.stockCollRef, existingBatch.id);
      await updateDoc(docRef, { quantity: newQuantity });
    } else {
      // Create new batch with this expiry date
      if (!product) {
        throw new Error('Product information required to create new stock batch');
      }

      // Calculate manufacture date from expiry date and shelf life
      const expiryDateObj = new Date(expiryDate);
      const manufactureDateObj = new Date(expiryDateObj);
      manufactureDateObj.setDate(manufactureDateObj.getDate() - product.shelfLife);

      const manufactureDate = manufactureDateObj.toISOString().split('T')[0]; // yyyy-MM-dd

      const newStockItem: StockItem = {
        id: '',
        product: product,
        manufactureDate: manufactureDate,
        expiryDate: expiryDate,
        quantity: quantity
      };

      await this.addStockItem(newStockItem);
    }
  }

  // Check total availability across all batches
  async checkStockAvailability(productId: string, requiredQuantity: number): Promise<boolean> {
    const stockItems = await this.getStockItemsForProduct(productId);

    if (stockItems.length === 0) {
      return false;
    }

    const totalAvailable = stockItems.reduce((sum, item) => sum + item.data.quantity, 0);
    return totalAvailable >= requiredQuantity;
  }

  // Get total stock quantity across all batches
  async getStockQuantity(productId: string): Promise<number> {
    const stockItems = await this.getStockItemsForProduct(productId);
    return stockItems.reduce((total, item) => total + item.data.quantity, 0);
  }

  // Get all stock items for a specific product
  async getAllStockItemsForProduct(productId: string): Promise<StockItem[]> {
    const stockItems = await this.getStockItemsForProduct(productId);
    return stockItems.map(item => item.data);
  }
}