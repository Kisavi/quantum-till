import { Product } from "./product";
import { User } from "./user";

export interface TripStockAllocation {
    id: string;
    tripId: string;
    product: Product;
    quantity: number;
    allocatedBy: User;
    allocatedAt: Date;
    sourceStockExpiry?: string;
}

export interface insufficientStockProducts {
    name: string;
    requested: number;
    available: number,
    product: Product;
}

