
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, setDoc, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category, ConsolidatedStock, Item, RawMaterial, StockStatus } from '../models/raw-material';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private categoriesCol;
  private itemsCol;
  private rawMaterialsCol;

  constructor(private firestore: Firestore) {
    this.categoriesCol = collection(this.firestore, 'categories');
    this.itemsCol = collection(this.firestore, 'items');
    this.rawMaterialsCol = collection(this.firestore, 'rawMaterials');

  }

  // Categories
  getCategories(): Observable<Category[]> {
    return collectionData(this.categoriesCol, { idField: 'id' }) as Observable<Category[]>;
  }

  async addCategory(cat: Omit<Category, 'id'>): Promise<string> {
    const newDoc = doc(this.categoriesCol);
    await setDoc(newDoc, cat);
    return newDoc.id;
  }

  async updateCategory(id: string, changes: Partial<Omit<Category, 'id'>>): Promise<void> {
  const docRef = doc(this.firestore, 'categories', id);
  await updateDoc(docRef, changes);
}

  // Items (simple: name + category)
  getItems(): Observable<Item[]> {
    return collectionData(this.itemsCol, { idField: 'id' }) as Observable<Item[]>;
  }

  getItemsByCategory(categoryId: string): Observable<Item[]> {
    return this.getItems().pipe(
      map(items => items.filter(item => item.categoryId === categoryId))
    );
  }

  async addItem(item: Omit<Item, 'id'>): Promise<string> {
    const newDoc = doc(this.itemsCol);
    await setDoc(newDoc, item);
    return newDoc.id;
  }

  async updateItem(id: string, changes: Partial<Omit<Item, 'id'>>): Promise<void> {
  const docRef = doc(this.firestore, 'items', id);
  await updateDoc(docRef, changes);
}


  // Raw Materials (stock entries)
  getRawMaterials(): Observable<RawMaterial[]> {
    return collectionData(this.rawMaterialsCol, { idField: 'id' }) as Observable<RawMaterial[]>;
  }

  async addRawMaterial(raw: Omit<RawMaterial, 'id'>): Promise<string> {
    const newDoc = doc(this.rawMaterialsCol);
    await setDoc(newDoc, raw);
    return newDoc.id;
  }

  async updateRawMaterial(id: string, raw: Partial<RawMaterial>): Promise<void> {
    const docRef = doc(this.firestore, 'rawMaterials', id);
    await updateDoc(docRef, raw);
  }

  async deleteRawMaterial(id: string): Promise<void> {
    const docRef = doc(this.firestore, 'rawMaterials', id);
    await deleteDoc(docRef);
  }

  // Consolidated Stock (computed view)
  getConsolidatedStock(): Observable<ConsolidatedStock[]> {
    return combineLatest([
      this.getItems(),
      this.getCategories(),
      this.getRawMaterials()
    ]).pipe(
      map(([items, categories, rawMaterials]) => {
        const categoryMap = new Map(
          categories.map(c => [c.id, c.name])
        );

        const grouped = rawMaterials.reduce((acc, raw) => {
          if (!acc[raw.itemId]) acc[raw.itemId] = [];
          acc[raw.itemId].push(raw);
          return acc;
        }, {} as Record<string, RawMaterial[]>);

        return items.map(item => {
          const entries = grouped[item.id] || [];
          const currentStock = entries.reduce(
            (sum, e) => sum + e.quantity,
            0
          );

          // Get threshold from latest entry (if any)
          const lowStockThreshold =
            entries.length > 0
              ? entries.reduce((a, b) =>
                new Date(a.purchaseDate).getTime() >
                  new Date(b.purchaseDate).getTime()
                  ? a
                  : b
              ).lowStockThreshold
              : 0;

          let status: StockStatus = 'In Stock';
          if (currentStock <= 0) status = 'Out of Stock';
          else if (currentStock <= lowStockThreshold)
            status = 'Low Stock';

          return {
            id: item.id,
            item,
            categoryName:
              categoryMap.get(item.categoryId) || 'Unknown',
            currentStock,
            status
          };
        });
      })
    );
  }

  async deleteItem(itemId: string): Promise<void> {
    const docRef = doc(this.firestore, 'items', itemId);
    await deleteDoc(docRef);
  }

}