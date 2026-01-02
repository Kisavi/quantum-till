import { ProductStock } from './product-stock';

export interface CartItem {
  stockItem: ProductStock;
  quantity: number;
}
