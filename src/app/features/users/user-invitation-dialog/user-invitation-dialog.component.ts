import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button, ButtonDirective } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { RoleName } from '../../../core/models/role-name';
import { UserService } from '../../../core/services/user.service';
import { TabsModule } from 'primeng/tabs';
import { AsyncPipe, JsonPipe } from '@angular/common';

@Component({
  selector: 'app-user-invitation-dialog',
  imports: [
    Dialog,
    Select,
    InputTextModule,
    ReactiveFormsModule,
    Toast,
    ButtonDirective,
    TabsModule,
    AsyncPipe,
  ],
  templateUrl: './user-invitation-dialog.component.html',
  providers: [MessageService],
})
export class UserInvitationDialogComponent {
  private userService = inject(UserService);
  private messageService = inject(MessageService);

  visible = input(false);
  visibleChange = output<boolean>();

  saving = false;
  roles: RoleName[] = ['ADMIN', 'MANAGER', 'RIDER', 'COOK'];
  invitations$ = this.userService.getInvitations();

  invitationForm = new FormGroup({
    email: new FormControl('', Validators.email),
    role: new FormControl(),
  });

  async invite(): Promise<void> {
    this.saving = true;
    const { email, role } = this.invitationForm.value;

    if (!email || !role) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please provide a valid email and role',
      });
      this.saving = false;
      return;
    }

    try {
      await this.userService.inviteUser(email!, role);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Invitation sent',
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

  async deleteInvitation(invitationId: string): Promise<void> {
    try {
      await this.userService.deleteInvitation(invitationId);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Invitation deleted',
      });
    } catch (e) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete invitation',
      });
      console.error(e);
    }
  }

  closeDialog(): void {
    this.invitationForm.reset();
    this.visibleChange.emit(false);
  }
}
