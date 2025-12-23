import { User as FirebaseUser } from 'firebase/auth';
import { Role } from './role';

export interface User extends FirebaseUser {
  role: Role;
  active: boolean;
  valid: boolean;
  rating: number;
}
