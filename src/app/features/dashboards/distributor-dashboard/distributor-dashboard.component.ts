import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { AccordionModule } from 'primeng/accordion';
import { Subscription, combineLatest } from 'rxjs';
import { DistributorDashboardService } from '../../../core/services/distributor-dashboard.service';
import { TripAllocationService } from '../../../core/services/trip-allocation.service';
import { TripService } from '../../../core/services/trip.service';
import { DistributorTripSummary, ProductStockSummary } from '../../../core/models/dashboard-summary';
import { TripStockAllocation } from '../../../core/models/trip-stock-allocation';
import { Sale } from '../../../core/models/sale';
import { ReturnItem } from '../../../core/models/return-item';
import { Expense } from '../../../core/models/expense';
import { CartItem } from '../../../core/models/cart-item';
import { environment } from '../../../../environments/environment';
import { getExpenseType } from '../../../core/helpers/expense-type';
import { LoaderSkeletonComponent } from '../../../core/shared/loader-skeleton/loader-skeleton.component';
import { Trip } from '../../../core/models/trip';
import { TimestampMillisPipe } from '../../../core/pipes/timestamp-millis.pipe';

@Component({
  selector: 'app-distributor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TableModule,
    TagModule,
    SkeletonModule,
    LoaderSkeletonComponent,
    TimestampMillisPipe,
    AccordionModule
  ],
  templateUrl: './distributor-dashboard.component.html'
})
export class DistributorDashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DistributorDashboardService);
  private allocationService = inject(TripAllocationService);
  private tripService = inject(TripService);
  private auth = inject(Auth);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  showTripSelection = true;
  userTrips: Trip[] = [];
  isLoadingTrips = true;

  summary: DistributorTripSummary | null = null;
  currentTrip: Trip | null = null;
  selectedTrip: Trip | null = null;

  // Expense lists for display
  personalExpensesList: Expense[] = [];
  companyExpensesList: Expense[] = [];

  isLoadingTrip = false;
  isLoadingAllocations = false;
  isLoadingSales = false;
  isLoadingReturns = false;
  isLoadingExpenses = false;

  get isLoading(): boolean {
    return this.isLoadingTrip || this.isLoadingAllocations ||
      this.isLoadingSales || this.isLoadingReturns || this.isLoadingExpenses;
  }

  hasError = false;
  errorMessage = '';

  private subscription?: Subscription;
  private tripId?: string;
  private userId?: string;

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid;

    if (!this.userId) {
      this.hasError = true;
      this.errorMessage = 'User not authenticated';
      this.isLoadingTrips = false;
      return;
    }

    this.route.queryParams.subscribe(params => {
      this.tripId = params['tripId'];

      if (this.tripId) {
        this.showTripSelection = false;
        this.loadDashboard();
      } else {
        this.showTripSelection = true;
        this.loadUserTrips();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  loadUserTrips(): void {
    this.isLoadingTrips = true;
    this.hasError = false;

    this.tripService.getTripsByUser(this.userId!).subscribe({
      next: (trips) => {
        this.userTrips = trips;
        this.isLoadingTrips = false;

        if (trips.length === 0) {
          this.hasError = true;
          this.errorMessage = 'No trips assigned yet. Please contact admin.';
        }
      },
      error: (error) => {
        console.error('Error loading trips:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load trips';
        this.isLoadingTrips = false;
      }
    });
  }

  selectTrip(trip: Trip): void {
    this.selectedTrip = trip;
    if (!trip.id) return;
    this.router.navigate(['/distributor/dashboard'], {
      queryParams: { tripId: trip.id }
    });
  }

  backToTripSelection(): void {
    this.router.navigate(['/distributor/dashboard']);
  }

  loadDashboard(): void {
    if (!this.tripId || !this.userId) return;

    this.hasError = false;
    this.isLoadingTrip = true;
    this.isLoadingAllocations = true;
    this.isLoadingSales = true;
    this.isLoadingReturns = true;
    this.isLoadingExpenses = true;

    const trip$ = this.tripService.getAllTrips();
    const allocations$ = this.allocationService.getAllocationsByTrip(this.tripId);
    const sales$ = this.dashboardService.getTripSales(this.tripId);
    const returns$ = this.dashboardService.getTripReturns(this.tripId);
    const expenses$ = this.dashboardService.getTripExpenses(this.tripId);

    this.subscription = combineLatest([
      trip$,
      allocations$,
      sales$,
      returns$,
      expenses$
    ]).subscribe({
      next: ([trips, allocations, sales, returns, expenses]) => {
        this.currentTrip = trips.find(t => t.id === this.tripId) || null;

        if (!this.currentTrip) {
          this.hasError = true;
          this.errorMessage = 'Trip not found';
          this.isLoadingTrip = false;
          return;
        }

        // Separate expenses by type for display
        const relevantExpenses = expenses.filter(e =>
          e.status === 'APPROVED' || e.status === 'PENDING'
        );

        this.personalExpensesList = relevantExpenses.filter(e => {
          const expenseType = e.expenseType || getExpenseType(e.reason);
          return expenseType === 'PERSONAL';
        });

        this.companyExpensesList = relevantExpenses.filter(e => {
          const expenseType = e.expenseType || getExpenseType(e.reason);
          return expenseType === 'COMPANY';
        });

        this.summary = this.calculateSummary(
          this.currentTrip,
          allocations,
          sales,
          returns,
          expenses
        );

        this.isLoadingTrip = false;
        this.isLoadingAllocations = false;
        this.isLoadingSales = false;
        this.isLoadingReturns = false;
        this.isLoadingExpenses = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to load dashboard';

        this.isLoadingTrip = false;
        this.isLoadingAllocations = false;
        this.isLoadingSales = false;
        this.isLoadingReturns = false;
        this.isLoadingExpenses = false;
      }
    });
  }

  private calculateProductSummaries(
    allocations: TripStockAllocation[],
    sales: Sale[],
    returns: ReturnItem[]
  ): ProductStockSummary[] {
    const productMap = new Map<string, ProductStockSummary>();

    allocations.forEach(allocation => {
      const pricePerPiece = allocation.product.unitPrice / allocation.product.piecesPerPacket;
      const initialValue = allocation.quantity * pricePerPiece;

      productMap.set(allocation.product.id, {
        product: allocation.product,
        allocated: allocation.quantity,
        sold: 0,
        returned: 0,
        remaining: allocation.quantity,
        salesValue: 0,
        returnsValue: 0,
        unsoldReturnsValue: 0,
        remainingValue: initialValue
      });
    });

    sales.forEach(sale => {
      sale.items.forEach((item: CartItem) => {
        const productId = item.stockItem.product.id;
        const summary = productMap.get(productId);

        if (summary) {
          summary.sold += item.quantity;
          summary.remaining -= item.quantity;

          const pricePerPiece = item.stockItem.product.unitPrice / item.stockItem.product.piecesPerPacket;
          summary.salesValue += item.quantity * pricePerPiece;

          summary.remainingValue = summary.remaining * pricePerPiece;
        }
      });
    });

    returns.forEach(returnItem => {
      const summary = productMap.get(returnItem.product.id);

      if (summary) {
        summary.returned += returnItem.quantity;

        const pricePerPiece = returnItem.product.unitPrice / returnItem.product.piecesPerPacket;
        const returnValue = returnItem.quantity * pricePerPiece;

        summary.returnsValue += returnValue;

        if (returnItem.reason === 'UNSOLD') {
          summary.remaining += returnItem.quantity;
          summary.unsoldReturnsValue += returnValue;
        } else {
          summary.remaining -= returnItem.quantity;
        }

        summary.remainingValue = summary.remaining * pricePerPiece;
      }
    });

    return Array.from(productMap.values());
  }

  private calculateSummary(
    trip: Trip,
    allocations: TripStockAllocation[],
    sales: Sale[],
    returns: ReturnItem[],
    expenses: Expense[]
  ): DistributorTripSummary {
    const completedSales = sales.filter(s => s.status === 'COMPLETED');
    const productSummaries = this.calculateProductSummaries(allocations, completedSales, returns);

    // Stock totals
    const totalAllocated = productSummaries.reduce((sum, p) => sum + p.allocated, 0);
    const totalSold = productSummaries.reduce((sum, p) => sum + p.sold, 0);
    const totalReturned = productSummaries.reduce((sum, p) => sum + p.returned, 0);
    const remainingStock = productSummaries.reduce((sum, p) => sum + p.remaining, 0);

    // Money calculations
    const grossSales = productSummaries.reduce((sum, p) => sum + p.salesValue, 0);
    const returnsValue = productSummaries.reduce((sum, p) => sum + p.returnsValue, 0);
    const unsoldReturnsValue = productSummaries.reduce((sum, p) => sum + p.unsoldReturnsValue, 0);
    const netSales = grossSales - unsoldReturnsValue;

    // Stock value calculations
    const initialStockValue = productSummaries.reduce((sum, p) => {
      const pricePerPiece = p.product.unitPrice / p.product.piecesPerPacket;
      return sum + (p.allocated * pricePerPiece);
    }, 0);

    const remainingStockValue = productSummaries.reduce((sum, p) => sum + p.remainingValue, 0);

    const stockSoldPercentage = initialStockValue > 0
      ? Math.round((grossSales / initialStockValue) * 100)
      : 0;

    // Payment method breakdown
    const paymentBreakdown = this.calculatePaymentBreakdown(completedSales);

    // Expense calculations - Include PENDING and APPROVED
    const relevantExpenses = expenses.filter(e =>
      e.status === 'APPROVED' || e.status === 'PENDING'
    );

    const companyExpenses = relevantExpenses.reduce((sum, e) => {
      const expenseType = e.expenseType || getExpenseType(e.reason);
      return expenseType === 'COMPANY' ? sum + e.amount : sum;
    }, 0);

    const personalExpenses = relevantExpenses.reduce((sum, e) => {
      const expenseType = e.expenseType || getExpenseType(e.reason);
      return expenseType === 'PERSONAL' ? sum + e.amount : sum;
    }, 0);

    const totalExpenses = companyExpenses + personalExpenses;

    // Separate pending expenses for display
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING');

    const pendingCompanyExpenses = pendingExpenses.reduce((sum, e) => {
      const expenseType = e.expenseType || getExpenseType(e.reason);
      return expenseType === 'COMPANY' ? sum + e.amount : sum;
    }, 0);

    const pendingPersonalExpenses = pendingExpenses.reduce((sum, e) => {
      const expenseType = e.expenseType || getExpenseType(e.reason);
      return expenseType === 'PERSONAL' ? sum + e.amount : sum;
    }, 0);

    // Expenses by payment method
    const cashExpenses = relevantExpenses.reduce((sum, e) => {
      return e.paymentMethod === 'CASH' ? sum + e.amount : sum;
    }, 0);

    const mpesaExpenses = relevantExpenses.reduce((sum, e) => {
      return e.paymentMethod === 'MPESA' ? sum + e.amount : sum;
    }, 0);

    // DAILY COMMISSION CALCULATION
    const commissionRate = environment.commissionRate;
    const commissionEarned = (grossSales * commissionRate) / 100;
    const commissionAfterPersonalExpenses = commissionEarned - personalExpenses;

    // DAILY SETTLEMENT CALCULATIONS
    // Expected: Gross Sales - All Expenses (Company + Personal)
    const expectedDailySubmission = grossSales - totalExpenses;

    // Actual money collected from trip (0 if trip not ended)
    const actualMoneyCollected = trip.actualCashSubmission || 0;

    // Daily variance: positive = excess, negative = shortage
    const dailyVariance = actualMoneyCollected - expectedDailySubmission;

    // Physical money breakdown (for display only)
    const physicalCashBalance = paymentBreakdown.cash - cashExpenses;
    const physicalMpesaBalance = paymentBreakdown.mpesaTotal - mpesaExpenses;
    const totalPhysicalMoney = physicalCashBalance + physicalMpesaBalance;

    // FINAL AMOUNT DISTRIBUTOR GETS/OWES
    // Formula: Commission - Personal Expenses ± Daily Variance
    const finalDistributorAmount = commissionAfterPersonalExpenses + dailyVariance;

    return {
      tripId: trip.id!,
      userId: this.userId!,
      userName: trip.distributor?.displayName || 'Unknown',
      routeName: trip.route?.name || 'Unknown Route',
      vehicleRegNo: trip.vehicle?.regNo || 'Unknown Vehicle',
      tripStatus: trip.status,
      productSummaries,
      totalAllocated: this.round(totalAllocated),
      totalSold: this.round(totalSold),
      totalReturned: this.round(totalReturned),
      remainingStock: this.round(remainingStock),
      grossSales: this.round(grossSales),
      returnsValue: this.round(returnsValue),
      netSales: this.round(netSales),
      companyExpenses: this.round(companyExpenses),
      personalExpenses: this.round(personalExpenses),
      totalExpenses: this.round(totalExpenses),
      pendingCompanyExpenses: this.round(pendingCompanyExpenses),
      pendingPersonalExpenses: this.round(pendingPersonalExpenses),
      commissionRate,
      commissionEarned: this.round(commissionEarned),
      commissionAfterPersonalExpenses: this.round(commissionAfterPersonalExpenses),
      expectedDailySubmission: this.round(expectedDailySubmission),
      actualMoneyCollected: this.round(actualMoneyCollected),
      dailyVariance: this.round(dailyVariance),
      finalDistributorAmount: this.round(finalDistributorAmount),
      mpesaTotal: this.round(paymentBreakdown.mpesaTotal),
      cashReceived: this.round(paymentBreakdown.cash),
      mpesaDepositReceived: this.round(paymentBreakdown.mpesaDeposit),
      tillNumberReceived: this.round(paymentBreakdown.tillNumber),
      sendMoneyReceived: this.round(paymentBreakdown.sendMoney),
      physicalCashBalance: this.round(physicalCashBalance),
      physicalMpesaBalance: this.round(physicalMpesaBalance),
      totalPhysicalMoney: this.round(totalPhysicalMoney),
      initialStockValue: this.round(initialStockValue),
      remainingStockValue: this.round(remainingStockValue),
      cashExpenses: this.round(cashExpenses),
      mpesaExpenses: this.round(mpesaExpenses),
      stockSoldPercentage
    };
  }

  private calculatePaymentBreakdown(sales: Sale[]): {
    cash: number;
    mpesaDeposit: number;
    tillNumber: number;
    sendMoney: number;
    mpesaTotal: number;
  } {
    const breakdown = {
      cash: 0,
      mpesaDeposit: 0,
      tillNumber: 0,
      sendMoney: 0,
      mpesaTotal: 0
    };

    sales.forEach(sale => {
      switch (sale.paymentMethod) {
        case 'CASH':
          breakdown.cash += sale.totalPrice;
          break;
        case 'MPESA_DEPOSIT':
          breakdown.mpesaDeposit += sale.totalPrice;
          breakdown.mpesaTotal += sale.totalPrice;
          break;
        case 'TILL_NUMBER':
          breakdown.tillNumber += sale.totalPrice;
          breakdown.mpesaTotal += sale.totalPrice;
          break;
        case 'SEND_MONEY':
          breakdown.sendMoney += sale.totalPrice;
          breakdown.mpesaTotal += sale.totalPrice;
          break;
      }
    });

    return breakdown;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  navigateToSales(): void {
    this.router.navigate(['/sales'], { queryParams: { tripId: this.tripId } });
  }

  navigateToReturns(): void {
    this.router.navigate(['/returns'], { queryParams: { tripId: this.tripId } });
  }

  navigateToExpenses(): void {
    this.router.navigate(['/expenses'], { queryParams: { tripId: this.tripId } });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ONGOING': return 'bg-blue-100 text-blue-800';
      case 'ENDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getTripStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' {
    switch (status) {
      case 'ONGOING': return 'success';
      case 'PENDING': return 'warn';
      case 'ENDED': return 'info';
      default: return 'info';
    }
  }

  getVarianceClass(variance: number): string {
    if (variance > 0) return 'text-green-700';
    if (variance < 0) return 'text-red-700';
    return 'text-blue-700';
  }

  getVarianceLabel(variance: number): string {
    if (variance > 0) return 'Excess Cash';
    if (variance < 0) return 'Cash Shortage';
    return 'Exact Amount';
  }

  getFinalAmountClass(amount: number): string {
    if (amount > 0) return 'text-green-700';
    if (amount < 0) return 'text-red-700';
    return 'text-gray-600';
  }

  getFinalAmountLabel(amount: number): string {
    if (amount > 0) return 'Distributor Receives';
    if (amount < 0) return 'Distributor Owes Company';
    return 'Break Even';
  }

  formatQuantity(quantity: number, product: any): string {
    if (!product || !product.piecesPerPacket || product.piecesPerPacket <= 1) {
      return `${quantity} ${quantity === 1 ? 'pkt' : 'pkts'}`;
    }

    const packets = Math.floor(quantity / product.piecesPerPacket);
    const pieces = quantity % product.piecesPerPacket;

    if (packets === 0 && pieces === 0) return '0';
    if (packets === 0) return `${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
    if (pieces === 0) return `${packets} ${packets === 1 ? 'pkt' : 'pkts'}`;

    return `${packets} ${packets === 1 ? 'pkt' : 'pkts'} + ${pieces} ${pieces === 1 ? 'pc' : 'pcs'}`;
  }
}