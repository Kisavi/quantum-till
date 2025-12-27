import { User as FirebaseUser } from 'firebase/auth';
import { RoleName } from './role-name';

export interface User extends FirebaseUser {
  role: RoleName;
  active: boolean;
  valid: boolean;
  rating: number;
}
