import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { Toast } from 'primeng/toast';
import { Sale } from '../../../core/models/sale';

@Component({
  selector: 'app-sale-details',
  imports: [Button, Toast, Dialog, CurrencyPipe, DatePipe, NgClass],
  templateUrl: './sale-details.component.html',
})
export class SaleDetailsComponent {
  sale = input<Sale>();
  visible = input(false);
  visibleChange = output<boolean>();

  closeDialog(): void {
    this.visibleChange.emit(false);
  }
}
