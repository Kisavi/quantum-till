import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { CheckboxChangeEvent } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { Customer } from '../../../core/models/customer';
import { PaymentMethod } from '../../../core/models/sale';
import { CartService } from '../../../core/services/cart.service';
import { CustomerService } from '../../../core/services/customer.service';
import { SaleService } from '../../../core/services/sale.service';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, Dialog, Select, CurrencyPipe, AsyncPipe, Button, Toast],
  templateUrl: './checkout.component.html',
  providers: [MessageService],
})
export class CheckoutComponent {
  private cartService = inject(CartService);
  private saleService = inject(SaleService);
  private messageService = inject(MessageService);
  private customerService = inject(CustomerService);

  visible = input(false);
  visibleChange = output<boolean>();

  saving = false;
  paymentMethods = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Till Number', value: 'TILL_NUMBER' },
    { label: 'Send Money', value: 'SEND_MONEY' },
    { label: 'Mpesa Deposit', value: 'MPESA_DEPOSIT' },
  ];
  customers$ = this.customerService.getCustomers();
  subTotal = this.cartService.subTotal;

  printReceipt = false;

  checkoutForm = new FormGroup({
    paymentMethod: new FormControl('CASH'),
    paid: new FormControl(true),
    customer: new FormControl(),
  });

  setReceiptPrinting(change: CheckboxChangeEvent): void {
    this.printReceipt = change.checked;
  }

  async checkout(): Promise<void> {
    this.saving = true;
    const { customer, paymentMethod, paid } = this.checkoutForm.value;
    const items = this.cartService.items();
    const status = paid ? 'COMPLETED' : 'PENDING';
    const walkInCustomer = { id: 'walk-in', name: 'Walk-in Customer' } as Customer;

    try {
      await this.saleService.checkout(
        customer || walkInCustomer,
        paymentMethod as PaymentMethod,
        items,
        this.subTotal(),
        status,
      );

      this.cartService.clearCart();

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Sale recorded',
      });

      this.closeDialog();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Sale failed. Please check your internet connection and try again',
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  closeDialog(): void {
    this.checkoutForm.reset();
    this.visibleChange.emit(false);
  }
}
