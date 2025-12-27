import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { RoleName } from '../../../core/models/role-name';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-invitation-dialog',
  imports: [Dialog, Select, Button, InputTextModule, ReactiveFormsModule, Toast],
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

  invitationForm = new FormGroup({
    email: new FormControl(),
    role: new FormControl(),
  });

  async invite(): Promise<void> {
    this.saving = true;
    const { email, role } = this.invitationForm.value;

    try {
      await this.userService.inviteUser(email, role);

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
        detail: 'Invitation failed',
      });
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  closeDialog(): void {
    this.invitationForm.reset();
    this.visibleChange.emit(false);
  }
}
