export interface Distributor {
  id: number;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  idNumber: string;
  phone: string;
  email: string;
  role: 'driver' | 'sales_person';
  carAssigned: string;
  routesAssigned: string[];
  idFront: string;
  idBack: string;
  profilePicture: string;
  status: 'active' | 'inactive';
  dateJoined: Date;
  dateLeft?: Date;
}

export interface Option {
  label: string;
  value: string;
}