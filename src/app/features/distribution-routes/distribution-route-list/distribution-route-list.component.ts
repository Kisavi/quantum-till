import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { DistributionRoute } from '../../../core/models/distribution-route';
import { DistributionRouteService } from '../../../core/services/distribution-route.service';
import { DistributionRouteAddComponent } from '../distribution-route-add/distribution-route-add.component';

@Component({
  selector: 'app-distribution-route-list',
  imports: [
    Toast,
    ConfirmDialog,
    Button,
    Card,
    AsyncPipe,
    TableModule,
    DistributionRouteAddComponent,
  ],
  templateUrl: './distribution-route-list.component.html',
  providers: [MessageService, ConfirmationService],
})
export class DistributionRouteListComponent {
  private distributionRouteService = inject(DistributionRouteService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  routes$ = this.distributionRouteService.getDistributionRoutes();
  dialogVisible = false;

  openDialog(): void {
    this.dialogVisible = true;
  }

  async deleteRoute(route: DistributionRoute): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `Delete ${route.name} route`,
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
          await this.distributionRouteService.deleteDistributionRoute(route.id);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Route deleted',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete route',
          });
          console.error(e);
        }
      },
    });
  }
}
