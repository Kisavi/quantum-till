import { DistributionRoute } from './distribution-route';
import { User } from './user';
import { Vehicle } from './vehicle';

export interface Trip {
  id?: string;
  distributor: User;
  route: DistributionRoute;
  vehicle: Vehicle;
  startOdometerReading: number;
  endOdometerReading?: number;
  startTime: Date;
  endTime?: Date;
  status: TripStatus;
  totalKm?: number;
  durationMinutes?: number;
  createdOn: Date,
  actualCashSubmission?: number;
}

export type TripStatus = 'PENDING' | 'ONGOING' | 'ENDED';

export interface CreateTripDto {
  distributor: User;
  route: DistributionRoute;
  vehicle: Vehicle;
  startOdometerReading: number;
  status: TripStatus;
  createdOn: Date;
}

export interface EndTripDto {
  endOdometerReading: number;
  endTime: Date;
  actualCashSubmission?: number;
}
