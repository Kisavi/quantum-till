export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export interface Category {
  id: string;
  name: string;
}
export interface Item {
  id: string;
  name: string;
  categoryId: string;         

}
export interface RawMaterial {
  id: string;
  itemId: string;                 // references Item.id
  quantity: number;               // in base units (e.g. 500 for 10 bags of 50kg)
  unitSize: number;               // e.g. 50 (kg per bag)
  baseUnit: string;               // e.g. "kg"
  purchaseUnit: string;           // e.g. "bag"
  purchasePrice: number;          // price per purchase unit this time
  lowStockThreshold: number;      // in base units
  supplierName: string;
  supplierContact: string;
  photoUrl?: string;
  notes?: string;
  purchaseDate: Date;
  dateAdded: Date;
}

export interface RawMaterialDisplay extends RawMaterial {
  itemName: string;
  categoryName: string;
  categoryId: string;
}

export interface ConsolidatedStock {
  id: string;
  item: Item;
  categoryName: string;
  currentStock: number;
  status: StockStatus;
}

