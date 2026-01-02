import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { Customer } from '../../../core/models/customer';
import { CustomerService } from '../../../core/services/customer.service';
import { CustomerAddComponent } from '../customer-add/customer-add.component';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-customer-list',
  imports: [
    CustomerAddComponent,
    Toast,
    ConfirmDialog,
    ButtonDirective,
    Card,
    AsyncPipe,
    TableModule,
    Tooltip,
  ],
  templateUrl: './customer-list.component.html',
  providers: [MessageService, ConfirmationService],
})
export class CustomerListComponent {
  private customerService = inject(CustomerService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  customers$ = this.customerService.getCustomers();

  dialogVisible = false;
  customer: Customer | null = null;

  openDialog(): void {
    this.dialogVisible = true;
  }

  editCustomer(customer: Customer): void {
    this.customer = customer;
    this.openDialog();
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.customer = null;
  }

  async deleteCustomer(customer: Customer): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `Delete ${customer.name}`,
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
          await this.customerService.deleteCustomer(customer.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Customer deleted',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete customer',
          });
          console.error(e);
        }
      },
    });
  }
}
