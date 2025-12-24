import { RawMaterialItem } from './raw-material';

export interface RecipeMaterial {
  id: string;
  rawMaterial: RawMaterialItem;
  unitSize: number;
}
