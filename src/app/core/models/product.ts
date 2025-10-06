export interface Product {
  id: string;
  name: string;
  unitPrice: number;
  itemsPerPacket: number; // Number of items per packet. Default = 1
  weight: number; // Grams
  shelfLife: number; // Days
}
