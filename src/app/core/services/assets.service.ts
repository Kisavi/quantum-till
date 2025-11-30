

import { Injectable } from '@angular/core';
import { Asset, ASSET_CATEGORIES, CreateAssetDto } from '../models/assets';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {
  private assets: Asset[] = [
    {
      id: 'a1',
      name: 'Mazda Demio KCK 9039',
      category: 'Vehicle',
      brand: 'Mazda',
      model: '2018',
      purchaseDate: new Date('2023-06-15'),
      purchaseCost: 1200000,
      status: 'Operational',
      photoUrl: 'https://images.pexels.com/photos/13627443/pexels-photo-13627443.jpeg',
      dateAdded: new Date('2023-06-20')
    },
    {
      id: 'a2',
      name: '60kg Spiral Mixer',
      category: 'Mixer',
      brand: 'Sinmag',
      purchaseDate: new Date('2024-01-10'),
      purchaseCost: 850000,
      status: 'Operational',
      photoUrl: 'https://images.pexels.com/photos/17833809/pexels-photo-17833809.jpeg',
      dateAdded: new Date()
    }
  ];

  get categoryOptions() {
  return ASSET_CATEGORIES.map(cat => ({
    label: cat,
    value: cat
  }));
}

  // categories = [...ASSET_CATEGORIES];

  // CREATE
  createAsset(dto: CreateAssetDto): Asset {
    const newAsset: Asset = {
      ...dto,
      id: 'a' + Date.now(),
      photoUrl: dto.photoBase64 ? 'uploaded' : undefined,
      dateAdded: new Date(),
      purchaseDate: new Date(dto.purchaseDate)
    };
    this.assets.unshift(newAsset);
    return newAsset;
  }

  // READ ALL
  getAssets(): Asset[] {
    return [...this.assets];
  }

  // UPDATE
  updateAsset(id: string, dto: Partial<CreateAssetDto>): Asset {
    const asset = this.assets.find(a => a.id === id);
    if (!asset) throw new Error('Asset not found');
    Object.assign(asset, dto);
    if (dto.photoBase64) asset.photoUrl = 'uploaded';
    return asset;
  }

  // DELETE
  deleteAsset(id: string): void {
    this.assets = this.assets.filter(a => a.id !== id);
  }

  // Total value
  getTotalValue(): number {
    return this.assets.reduce((sum, a) => sum + a.purchaseCost, 0);
  }
}