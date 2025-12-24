import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { Toast } from 'primeng/toast';
import { UserService } from '../../../core/services/user.service';
import { UserInvitationDialogComponent } from '../user-invitation-dialog/user-invitation-dialog.component';
import { ConfirmDialog } from "primeng/confirmdialog";

@Component({
  selector: 'app-user-list',
  imports: [TableModule, AsyncPipe, Button, Card, UserInvitationDialogComponent, Toast, ConfirmDialog],
  templateUrl: './user-list.component.html',
  providers: [MessageService, ConfirmationService],
})
export class UserListComponent {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  users$ = this.userService.getUsers();
  visible = false;

  openDialog(): void {
    this.visible = true;
  }

  async remove(uid: string): Promise<void> {
    try {
      await this.userService.removeUser(uid);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User removed',
      });
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to remove user',
      });
      console.error(e);
    }
  }
}
