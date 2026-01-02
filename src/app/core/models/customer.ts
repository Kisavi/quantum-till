import { User } from 'firebase/auth';
import { DistributionRoute } from './distribution-route';

export interface Customer {
  id: string;
  phoneNumber: string;
  name: string;
  location: string;
  image: string;
  route: DistributionRoute;
  createdBy: User;
}
