import { Timestamp } from '@angular/fire/firestore';

export function timestampToMillis(timestamp: Timestamp | any): number {
  if (!timestamp) return 0;

  if (typeof timestamp.seconds === 'number') {
    return timestamp.seconds * 1000;
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  return 0;
}
