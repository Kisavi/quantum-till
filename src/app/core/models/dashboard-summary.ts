// core/models/dashboard-summary.ts

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
    totalAllocated: number;
    totalSold: number;
    totalReturned: number;
    remainingStock: number;
    grossSales: number;
    returnsValue: number;
    netSales: number;
    companyExpenses: number;
    personalExpenses: number;
    pendingCompanyExpenses: number;
    pendingPersonalExpenses: number;
    netSalesAfterCompanyExpenses: number;
    commissionRate: number;
    commissionEarned: number;
    commissionAfterPersonalExpenses: number;
    amountToSubmit: number;
    distributorTakesHome: number;
    creditBalance: number;

    mpesaTotal: number;
    cashReceived: number;
    mpesaDepositReceived: number;
    tillNumberReceived: number;
    sendMoneyReceived: number;

    initialStockValue: number;
    remainingStockValue: number;
    stockSoldPercentage: number;
    cashExpenses: number;
    mpesaExpenses: number;
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
    totalCommissionAfterPersonalExpenses: number;
    totalAmountToCollect: number;
    totalDistributorEarnings: number;
    totalCreditOwed: number;
    totalDebtOwed: number;
    distributorSummaries: DistributorTripSummary[];
}