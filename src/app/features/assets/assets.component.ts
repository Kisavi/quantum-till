// src/app/assets/assets.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AssetsService } from '../../core/services/assets.service';
import { Asset, CreateAssetDto } from '../../core/models/assets';

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    CardModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './assets.component.html'
})
export class AssetsComponent implements OnInit {
  assets: Asset[] = [
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
  categories = [
    { label: 'Vehicle', value: 'Vehicle' },
    { label: 'Mixer', value: 'Mixer' },
    { label: 'Oven', value: 'Oven' },
    { label: 'Other', value: 'Other' }
  ];

  visibleDialog = false;
  visibleImageModal = false;
  selectedImageUrl = '';
  isEditing = false;
  editingAsset: Asset | null = null;

  assetForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private assetService: AssetsService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initForm();
    // this.loadAssets();
  }

  private initForm(): void {
    this.assetForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      brand: [''],
      model: [''],
      serialNumber: [''],
      purchaseDate: [null, Validators.required],
      purchaseCost: [null, [Validators.required, Validators.min(1)]],
      status: ['Operational', Validators.required],
      notes: [''],
      photoBase64: ['']
    });
  }

  loadAssets(): void {
    this.assets = this.assetService.getAssets();
  }

  get totalValue(): number {
    return this.assetService.getTotalValue();
  }

  showDialog(asset?: Asset): void {
    this.isEditing = !!asset;
    this.editingAsset = asset || null;
    this.assetForm.reset();

    if (asset) {
      this.assetForm.patchValue({
        name: asset.name,
        category: asset.category,
        brand: asset.brand,
        model: asset.model,
        serialNumber: asset.serialNumber,
        purchaseDate: asset.purchaseDate,
        purchaseCost: asset.purchaseCost,
        status: asset.status,
        notes: asset.notes
      });
    } else {
      this.assetForm.patchValue({ status: 'Operational' });
    }

    this.visibleDialog = true;
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.assetForm.patchValue({ photoBase64: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  }

  saveAsset(): void {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    const payload: CreateAssetDto = {
      ...this.assetForm.value,
      category: this.assetForm.value.category, // "Other" stays as "Other"
      purchaseDate: this.assetForm.value.purchaseDate
    };

    try {
      if (this.isEditing && this.editingAsset) {
        this.assetService.updateAsset(this.editingAsset.id, payload);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Asset updated successfully'
        });
      } else {
        this.assetService.createAsset(payload);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Asset added successfully'
        });
      }
      this.visibleDialog = false;
      this.loadAssets();
    } catch (err) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed'
      });
    }
  }

  deleteAsset(asset: Asset): void {
    if (confirm(`Delete "${asset.name}" permanently?`)) {
      this.assetService.deleteAsset(asset.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Asset removed'
      });
      this.loadAssets();
    }
  }

  viewImage(url?: string): void {
    if (url) {
      console.log(url)
      this.selectedImageUrl = url;
      this.visibleImageModal = true;
    }
  }

  getPreviewUrl(): string {
    return (
      this.assetForm.value.photoBase64 ||
      this.editingAsset?.photoUrl
    );
  }
}