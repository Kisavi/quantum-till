import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Staff {
  content = new BehaviorSubject('default content');

  other = signal('SIGNAL CONTENT');
}
