import { AsyncPipe, CurrencyPipe, DatePipe, JsonPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { Sale } from '../../../core/models/sale';
import { SaleService } from '../../../core/services/sale.service';
import { SaleDetailsComponent } from '../sale-details/sale-details.component';
import { Badge } from 'primeng/badge';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, Observable, switchMap } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { Auth } from '@angular/fire/auth';
@Component({
  selector: 'app-sales-history',
  imports: [
    Toast,
    ConfirmDialog,
    Button,
    Card,
    AsyncPipe,
    TableModule,
    SaleDetailsComponent,
    Badge,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './sales-history.component.html',
  providers: [MessageService, ConfirmationService],
})
export class SalesHistoryComponent implements OnInit {
  private saleService = inject(SaleService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
    private route = inject(ActivatedRoute);
    private auth = inject(Auth);
  private userService = inject(UserService);

  sales$ = this.saleService.getSales();

  dialogVisible = false;
  sale?: Sale;
  tripId?: string;

  viewSale(sale: Sale): void {
    this.dialogVisible = true;
    this.sale = sale;
  }

  
  ngOnInit(): void {
    this.tripId = this.route.snapshot.queryParams['tripId'];
    this.loadSales();
  }

  private loadSales(): void {
    this.sales$ = this.getSalesObservable();
    console.log(this.sales$.subscribe(sales => console.log('Loaded sales:', sales)));
  }

  async deleteSale(sale: Sale): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `Delete Sale`,
      closable: true,
      closeOnEscape: true,
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Continue',
        severity: 'danger',
      },
      accept: async () => {
        try {
          await this.saleService.deleteSale(sale.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Sale deleted',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete sale',
          });
          console.error(e);
        }
      },
    });
  }

    private getSalesObservable(): Observable<Sale[]> {
    return this.userService.getCurrentUserRoles().pipe(
      switchMap(roles => {
        // Show only sales for this trip
        if (this.tripId) {
          console.log('Loading sales for trip:', this.tripId);
          return this.saleService.getSalesByTrip(this.tripId);
        }

        // Show all sales
        if (roles.isAdmin || roles.isManager) {
          console.log('Loading all sales for admin/manager');
          return this.saleService.getSales();
        }

        // Show only their sales
        if (roles.isRider) {
          console.log('Loading sales for rider');
          const userId = this.auth.currentUser?.uid;
          if (userId) {
            return this.saleService.getSalesByUser(userId);
          }
        }

        return EMPTY;
      })
    );
  }
}
