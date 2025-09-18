import { User as FirebaseUser } from 'firebase/auth';
import { Role } from './role';

export interface User extends FirebaseUser {
  userId: string;
  role: Role;
  active: boolean;
  rating: number;
}
