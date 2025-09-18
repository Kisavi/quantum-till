import { Route } from './route';
import { Vehicle } from './vehicle';

export interface Trip {
  id: string;
  userId: string;
  route: Route;
  vehicle: Vehicle;
  startOdometerReading: number;
  endOdometerReading: number;
  status: TripStatus;
}

export type TripStatus = 'PENDING' | 'ONGOING' | 'ENDED';
