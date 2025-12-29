import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@angular/fire/firestore';

@Pipe({
  name: 'timestampMillis',
  standalone: true
})
export class TimestampMillisPipe implements PipeTransform {

  transform(value: Timestamp | Date | any): number {
    if (!value) return 0;

    if (typeof value.seconds === 'number') {
      return value.seconds * 1000;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    return 0;
  }
}
