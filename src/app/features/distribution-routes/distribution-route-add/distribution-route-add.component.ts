import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { DistributionRoute } from '../../../core/models/distribution-route';
import { DistributionRouteService } from '../../../core/services/distribution-route.service';

@Component({
  selector: 'app-distribution-route-add',
  imports: [Toast, Dialog, Button, ReactiveFormsModule, InputText],
  templateUrl: './distribution-route-add.component.html',
  providers: [MessageService],
})
export class DistributionRouteAddComponent {
  private distributionRouteService = inject(DistributionRouteService);
  private messageService = inject(MessageService);

  visible = input(false);
  visibleChange = output<boolean>();

  saving = false;

  routeForm = new FormGroup({
    name: new FormControl(),
  });

  async save(): Promise<void> {
    this.saving = true;
    const route = this.routeForm.value as DistributionRoute;

    try {
      await this.distributionRouteService.addDistributionRoute(route);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Route added',
      });
      this.closeDialog();
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Adding route failed',
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  closeDialog(): void {
    this.routeForm.reset();
    this.visibleChange.emit(false);
  }
}
