import { StockItem } from './stock-item';

export interface CartItem {
  stockItem: StockItem;
  quantity: number;
}
