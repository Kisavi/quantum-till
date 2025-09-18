import { Product } from './product';
import { RecipeMaterial } from './recipe-material';

export interface Recipe {
  id: string;
  product: Product;
  materials: RecipeMaterial[];
}
