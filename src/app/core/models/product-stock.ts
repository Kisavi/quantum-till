import { Product } from './product';

export interface ProductStock {
  id: string;
  product: Product;
  quantity: number;
}
