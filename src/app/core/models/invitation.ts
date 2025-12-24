import { RoleName } from './role-name';

export interface Invitation {
  id: string;
  email: string;
  accepted: boolean;
  role: RoleName;
}
