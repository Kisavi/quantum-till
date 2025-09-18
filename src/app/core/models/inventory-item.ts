import { RawMaterial } from './raw-material';

export interface InventoryItem {
  id: string;
  rawMaterial: RawMaterial;
  quantity: number;
}
