export interface Product {
  id: string;
  name: string;
  unitPrice: number;
  piecesPerPacket: number; // Number of pieces per packet. Default = 1
  weight: number; // Grams
  shelfLife: number; // Days
}
