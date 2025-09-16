import { Route } from './route';
import { TripStatus } from './trip-status';
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
