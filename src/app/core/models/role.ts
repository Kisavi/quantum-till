export interface Role {
  id: string;
  name: RoleName;
}

export type RoleName = 'ADMIN' | 'MANAGER' | 'RIDER' | 'COOK';
