import { User as FirebaseUser } from 'firebase/auth';

export interface User extends FirebaseUser {
  userId: string;
  role: Role;
  active: boolean;
  rating: number;
}

export type Role = 'ADMIN' | 'RIDER' | 'COOK';
