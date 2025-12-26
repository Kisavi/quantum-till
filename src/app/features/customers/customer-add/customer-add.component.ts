import { AsyncPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Customer } from '../../../core/models/customer';
import { CustomerService } from '../../../core/services/customer.service';
import { DistributionRouteService } from '../../../core/services/distribution-route.service';

@Component({
  selector: 'app-customer-add',
  imports: [Toast, Dialog, Select, AsyncPipe, InputText, Button, ReactiveFormsModule],
  templateUrl: './customer-add.component.html',
})
export class CustomerAddComponent {
  private customerService = inject(CustomerService);
  private messageService = inject(MessageService);
  private distributionRouteService = inject(DistributionRouteService);

  visible = input(false);
  visibleChange = output<boolean>();

  saving = false;
  routes$ = this.distributionRouteService.getDistributionRoutes();

  customerForm = new FormGroup({
    name: new FormControl(),
    route: new FormControl(),
    location: new FormControl(),
    phoneNumber: new FormControl(),
    image: new FormControl(),
  });

  async save(): Promise<void> {
    this.saving = true;
    const customer = this.customerForm.value as Customer;

    try {
      await this.customerService.addCustomer(customer);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Customer added',
      });
      this.closeDialog();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Adding customer failed',
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  closeDialog(): void {
    this.customerForm.reset();
    this.visibleChange.emit(false);
  }
}
