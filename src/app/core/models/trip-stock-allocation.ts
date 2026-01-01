import { Product } from "./product";

export interface TripStockAllocation {
    id: string;
    tripId: string;
    product: Product;
    quantity: number;
    allocatedBy: string;
    allocatedAt: Date;
    sourceStockExpiry?: string;
}

export interface insufficientStockProducts {
    name: string;
    requested: number;
    available: number,
    product: Product;
}

