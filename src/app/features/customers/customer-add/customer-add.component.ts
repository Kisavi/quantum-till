import { AsyncPipe } from '@angular/common';
import { Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Customer } from '../../../core/models/customer';
import { CustomerService } from '../../../core/services/customer.service';
import { DistributionRouteService } from '../../../core/services/distribution-route.service';

@Component({
  selector: 'app-customer-add',
  imports: [Toast, Dialog, Select, AsyncPipe, InputText, ButtonDirective, ReactiveFormsModule],
  templateUrl: './customer-add.component.html',
  providers: [MessageService],
})
export class CustomerAddComponent {
  private customerService = inject(CustomerService);
  private messageService = inject(MessageService);
  private distributionRouteService = inject(DistributionRouteService);

  visible = input(false);
  customer = input<Customer | null>(null);
  close = output();

  title!: string;
  saving = false;
  routes$ = this.distributionRouteService.getDistributionRoutes();

  customerForm = new FormGroup({
    name: new FormControl(),
    route: new FormControl(),
    location: new FormControl(),
    phoneNumber: new FormControl(),
    image: new FormControl(),
  });

  constructor() {
    effect(() => {
      const customer = this.customer();
      this.title = customer?.id ? 'Edit Customer' : 'Add Customer';

      if (customer) {
        this.customerForm.patchValue(customer);
      }
    });
  }

  async save(): Promise<void> {
    this.saving = true;
    let message;
    const customer = this.customerForm.value as Customer;

    try {
      if (this.customer()) {
        await this.customerService.updateCustomer(this.customer()!.id, customer);
        message = 'Customer updated';
      } else {
        await this.customerService.addCustomer(customer);
        message = 'Customer added';
      }

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: message,
      });
      this.closeDialog();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: (e as Error).message,
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  closeDialog(): void {
    this.customerForm.reset();
    this.close.emit();
  }
}
