import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { Card } from 'primeng/card';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  imports: [TableModule, AsyncPipe, Button, Card, Dialog, InputTextModule],
  templateUrl: './users.component.html',
})
export class UsersComponent {
  private userService = inject(UserService);

  users$ = this.userService.getUsers();

  visible = false;

  openDialog(): void {
    this.visible = true;
  }

  async remove(uid: string): Promise<void> {
    try {
      await this.userService.removeUser(uid);
      // TODO: show toast
      console.log('User removed');
    } catch (e) {
      // TODO: show toast
      console.error(e);
    }
  }
}
