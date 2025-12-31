import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Checkbox, CheckboxChangeEvent } from 'primeng/checkbox';
import { Dialog } from 'primeng/dialog';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { PaymentMethod } from '../../../core/models/sale';
import { CartService } from '../../../core/services/cart.service';
import { Toast } from 'primeng/toast';
import { SaleService } from '../../../core/services/sale.service';
import { CustomerService } from '../../../core/services/customer.service';

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
  paymentMethods: PaymentMethod[] = ['CASH', 'TILL_NUMBER', 'SEND_MONEY', 'MPESA_DEPOSIT'];
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

    try {
      await this.saleService.checkout(
        customer,
        paymentMethod as PaymentMethod,
        items,
        this.subTotal(),
        status,
      );

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
