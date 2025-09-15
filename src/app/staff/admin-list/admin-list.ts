import { Component, inject } from '@angular/core';
import { shared } from '../../core/shared';
import { Staff } from '../staff';

@Component({
  selector: 'app-admin-list',
  imports: [shared],
  templateUrl: './admin-list.html',
  styleUrl: './admin-list.css',
})
export class AdminList {
  _staff = inject(Staff);

  doSum() {
    this._staff.content.next(`HELLO WORLD ${new Date()}`);
    this._staff.other.set(`CHANGED TO: ${new Date()}`);
    console.log('Something done');
  }
}
