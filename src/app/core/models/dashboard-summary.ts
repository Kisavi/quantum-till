
import { Product } from "./product";
import { TripStatus } from "./trip";

export interface ProductStockSummary {
    product: Product;
    allocated: number;
    sold: number;
    returned: number;
    remaining: number;
    salesValue: number;
    returnsValue: number;
    unsoldReturnsValue: number;
    remainingValue: number;
}

export interface DistributorTripSummary {
    tripId: string;
    userId: string;
    userName: string;
    routeName: string;
    vehicleRegNo: string;
    tripStatus: TripStatus;
    productSummaries: ProductStockSummary[];
    
    // Stock quantities
    totalAllocated: number;
    totalSold: number;
    totalReturned: number;
    remainingStock: number;
    
    // Sales values
    grossSales: number;
    returnsValue: number;
    netSales: number;
    
    // Expenses 
    companyExpenses: number;
    personalExpenses: number;
    totalExpenses: number;
    pendingCompanyExpenses: number;
    pendingPersonalExpenses: number;
    
    // Commission
    commissionRate: number;
    commissionEarned: number;
    commissionAfterPersonalExpenses: number; 

    // Daily Settlement
    expectedDailySubmission: number; // Gross Sales minus all expenses
    actualMoneyCollected: number; // Cash + M-Pesa (after expense deductions)
    dailyVariance: number; // Actual - Expected (positive = excess, negative = shortage)
    
    // Final Amount Distributor Gets/Owes
    finalDistributorAmount: number; // Commission - Personal Expenses ± Daily Variance
    
    // Payment method breakdown
    mpesaTotal: number;
    cashReceived: number;
    mpesaDepositReceived: number;
    tillNumberReceived: number;
    sendMoneyReceived: number;
    cashExpenses: number;
    mpesaExpenses: number;
    
    // Physical money rider has
    physicalCashBalance: number; 
    physicalMpesaBalance: number; 
    totalPhysicalMoney: number; 
    
    // Stock values
    initialStockValue: number;
    remainingStockValue: number;
    stockSoldPercentage: number;
}

export interface AdminDailySummary {
    date: string;
    totalDistributors: number;
    totalGrossSales: number;
    totalReturnsValue: number;
    totalNetSales: number;
    totalCompanyExpenses: number;
    totalPersonalExpenses: number;
    totalCommissionEarned: number;
    totalExpectedSubmissions: number;
    totalActualCollections: number;
    totalDailyVariance: number;
    totalFinalDistributorPayments: number;
    distributorSummaries: DistributorTripSummary[];
}