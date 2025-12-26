import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Badge } from 'primeng/badge';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { User } from '../../../core/models/user';
import { UserService } from '../../../core/services/user.service';
import { UserInvitationDialogComponent } from '../user-invitation-dialog/user-invitation-dialog.component';

@Component({
  selector: 'app-user-list',
  imports: [
    TableModule,
    AsyncPipe,
    Button,
    Card,
    UserInvitationDialogComponent,
    Toast,
    ConfirmDialog,
    Badge,
  ],
  templateUrl: './user-list.component.html',
  providers: [MessageService, ConfirmationService],
})
export class UserListComponent {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  users$ = this.userService.getUsers();
  dialogVisible = false;

  openDialog(): void {
    this.dialogVisible = true;
  }

  async toggleActiveStatus(user: User): Promise<void> {
    this.confirmationService.confirm({
      message: 'Are you sure that you want to proceed?',
      header: `${user.active ? 'Deactivate' : 'Activate'} ${user.displayName}`,
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
          await this.userService.changeUserActiveStatus(user.uid, !user.active);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User status changed',
          });
        } catch (e) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to change user status',
          });
          console.error(e);
        }
      },
    });
  }
}
