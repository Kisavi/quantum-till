import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Category,
  RawMaterialItem,
  StockEntry,
  ConsolidatedStock,
  StockStatus
} from '../models/raw-material';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private categoriesCol;
  private itemsCol;
  private stockEntriesCol;

  constructor(private firestore: Firestore) {
    this.categoriesCol = collection(this.firestore, 'categories');
    this.itemsCol = collection(this.firestore, 'items');
    this.stockEntriesCol = collection(this.firestore, 'stockEntries');
  }

  /* =======================
   * Categories
   * ======================= */
  getCategories(): Observable<Category[]> {
    return collectionData(this.categoriesCol, { idField: 'id' }) as Observable<Category[]>;
  }

  async addCategory(cat: Omit<Category, 'id'>): Promise<string> {
    const ref = doc(this.categoriesCol);
    await setDoc(ref, cat);
    return ref.id;
  }

  async updateCategory(id: string, changes: Partial<Omit<Category, 'id'>>): Promise<void> {
    await updateDoc(doc(this.firestore, 'categories', id), changes);
  }

  async deleteCategory(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'categories', id));
  }

  /* =======================
   * Raw Material Items
   * ======================= */
  getItems(): Observable<RawMaterialItem[]> {
    return collectionData(this.itemsCol, { idField: 'id' }) as Observable<RawMaterialItem[]>;
  }

  getItemsByCategory(categoryId: string): Observable<RawMaterialItem[]> {
    return this.getItems().pipe(
      map(items => items.filter(i => i.categoryId === categoryId))
    );
  }

  async addItem(item: Omit<RawMaterialItem, 'id'>): Promise<string> {
    const ref = doc(this.itemsCol);
    await setDoc(ref, item);
    return ref.id;
  }

  async updateItem(
    id: string,
    changes: Partial<Omit<RawMaterialItem, 'id'>>
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'items', id), changes);
  }

  async deleteItem(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'items', id));
  }

  /* =======================
   * Stock Entries (Purchases)
   * ======================= */
  getStockEntries(): Observable<StockEntry[]> {
    return collectionData(this.stockEntriesCol, { idField: 'id' }) as Observable<StockEntry[]>;
  }

  async addStockEntry(entry: Omit<StockEntry, 'id'>): Promise<string> {
    const ref = doc(this.stockEntriesCol);
    await setDoc(ref, entry);
    return ref.id;
  }

  async updateStockEntry(
    id: string,
    changes: Partial<Omit<StockEntry, 'id'>>
  ): Promise<void> {
    await updateDoc(doc(this.firestore, 'stockEntries', id), changes);
  }

  async deleteStockEntry(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'stockEntries', id));
  }

  /* =======================
   * Consolidated Stock View
   * ======================= */
  getConsolidatedStock(): Observable<ConsolidatedStock[]> {
    return combineLatest([
      this.getItems(),
      this.getCategories(),
      this.getStockEntries()
    ]).pipe(
      map(([items, categories, entries]) => {
        const categoryMap = new Map(
          categories.map(c => [c.id, c.name])
        );

        const grouped = entries.reduce((acc, e) => {
          if (!acc[e.itemId]) acc[e.itemId] = [];
          acc[e.itemId].push(e);
          return acc;
        }, {} as Record<string, StockEntry[]>);

        return items.map(item => {
          const itemEntries = grouped[item.id] || [];
          const currentStock = itemEntries.reduce(
            (sum, e) => sum + e.quantity,
            0
          );

          let status: StockStatus = 'In Stock';
          if (currentStock <= 0) status = 'Out of Stock';
          else if (currentStock <= item.lowStockThreshold)
            status = 'Low Stock';

          return {
            id: item.id,
            item,
            categoryName: categoryMap.get(item.categoryId) || 'Unknown',
            currentStock,
            status
          };
        });
      })
    );
  }
}
