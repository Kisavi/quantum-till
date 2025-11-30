
export type AssetStatus = 'Operational' | 'Under Repair' | 'Faulty' | 'Disposed';

export const ASSET_CATEGORIES = [
  'Vehicle',
  'Oven',
  'Mixer',
  'Fridge/Freezer',
  'Weighing Scale',
  'Cookware',
  'Baking Trays',
  'Containers/Crates',
  'Display Units',
  'Decorative Items',
  'POS System',
  'Generator',
  'Other'
] as const;

export type AssetCategory = typeof ASSET_CATEGORIES[number];

export interface CreateAssetDto {
  name: string;
  category: string;          
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate: Date | string;
  purchaseCost: number;
  status: AssetStatus;
  notes?: string;
  photoBase64?: string;       
}

export interface Asset extends CreateAssetDto {
  id: string;
  photoUrl?: string;
  dateAdded: Date;
}