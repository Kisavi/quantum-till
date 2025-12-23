import { Role } from './role';

export interface Invitation {
  id: string;
  email: string;
  accepted: boolean;
  role: Role;
}
