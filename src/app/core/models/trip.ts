import { DistributionRoute } from './distribution-route';
import { Vehicle } from './vehicle';

// export interface Trip {
//   id: string;
//   userId: string;
//   route: Route;
//   vehicle: Vehicle;
//   startOdometerReading: number;
//   endOdometerReading: number;
//   status: TripStatus;
// }

export interface Trip {
  id: string;
  userId: string;
  driverName: string;
  route: DistributionRoute;
  vehicle: Vehicle;
  startOdometerReading: number;
  endOdometerReading?: number;
  startTime: Date;
  endTime?: Date;
  status: 'PENDING' | 'ONGOING' | 'ENDED';
  totalKm?: number;
  durationMinutes?: number;
}

export type TripStatus = 'PENDING' | 'ONGOING' | 'ENDED';

export interface CreateTripDto {
  routeId: string;
  vehicleId: string;
  startOdometerReading: number;
}

export interface EndTripDto {
  endOdometerReading: number;
}
