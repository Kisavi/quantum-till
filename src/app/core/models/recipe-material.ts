import { RawMaterial } from './raw-material';

export interface RecipeMaterial {
  id: string;
  rawMaterial: RawMaterial;
  unitSize: number;
}
