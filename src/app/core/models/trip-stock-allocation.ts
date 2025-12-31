import { Product } from "./product";

export interface TripStockAllocation {
  id: string;
  tripId: string;
  distributorId: string;
  product: Product;        
  quantity: number;       
  allocatedBy: string;
  allocatedAt: Date;
  sourceStockExpiry: Date;
}
