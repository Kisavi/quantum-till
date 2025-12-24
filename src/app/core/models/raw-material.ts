export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export interface Category {
  id: string;
  name: string;
}
export interface RawMaterialItem {
  id: string;
  name: string;
  categoryId: string;
  baseUnit: string;             // e.g. "kg", "litre",boxes,pcs    
  lowStockThreshold: number;     // in base units   
}

export interface RawMaterialItemDisplay extends RawMaterialItem {
  categoryName: string;
}

export interface StockEntry {
  id: string;
  itemId: string;                // references Item.id
  quantity: number;              // ALWAYS in base units
  purchasePrice: number;         // total price
  supplierName?: string;
  supplierContact?: string;
  notes?: string;
  photoUrl?: string;
  purchaseDate: Date;
  dateAdded: Date;
}
export interface StockEntryDisplay extends StockEntry {
  itemName: string;
  categoryName: string;
  categoryId: string;
}

export interface ConsolidatedStock {
  id: string;
  item: RawMaterialItem;
  categoryName: string;
  currentStock: number;
  status: StockStatus;
}

