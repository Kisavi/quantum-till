import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { shared } from '../../core/shared';
import { Staff } from '../staff';

@Component({
  selector: 'app-rider-list',
  imports: [...shared],
  templateUrl: './rider-list.html',
  styleUrl: './rider-list.css',
})
export class RiderList {
  _staff = inject(Staff);

  signalContent = this._staff.other;
  content = toSignal(this._staff.content);
}
