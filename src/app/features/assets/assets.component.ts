// features/assets/assets.component.ts

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Subscription } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

import { AssetsService } from '../../core/services/assets.service';
import { Asset, CreateAssetDto, ASSET_CATEGORIES } from '../../core/models/assets';
import { compressImageFile } from '../../core/helpers/image-helpers';

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
    ToastModule,
    ConfirmDialogModule,
    InputTextModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './assets.component.html'
})
export class AssetsComponent implements OnInit, OnDestroy {
  private assetService = inject(AssetsService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  assets: Asset[] = [];
  categories = ASSET_CATEGORIES.map(cat => ({ label: cat, value: cat }));

  visibleDialog = false;
  visibleImageModal = false;
  selectedImageUrl = '';
  isEditing = false;
  editingAsset: Asset | null = null;

  assetForm!: FormGroup;

  isLoadingAssets = true;
  isSavingAsset = false;

  private assetsSubscription?: Subscription;

  ngOnInit(): void {
    this.initForm();
    this.loadAssets();
  }

  ngOnDestroy(): void {
    this.assetsSubscription?.unsubscribe();
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
    this.isLoadingAssets = true;
    this.assetsSubscription = this.assetService.getAssets().subscribe({
      next: (assets) => {
        // Convert Firestore Timestamps to Dates
        this.assets = assets.map(asset => ({
          ...asset,
          purchaseDate: this.toDate(asset.purchaseDate),
          dateAdded: this.toDate(asset.dateAdded),
          updatedAt: asset.updatedAt ? this.toDate(asset.updatedAt) : undefined
        }));
        this.isLoadingAssets = false;
      },
      error: (error) => {
        console.error('Error loading assets:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load assets'
        });
        this.isLoadingAssets = false;
      }
    });
  }

  get totalValue(): number {
    return this.assets.reduce((sum, asset) => sum + asset.purchaseCost, 0);
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

  async onFileChange(event: any): Promise<void> {
    const file: File = event.target.files[0];
    if (!file) return;

    try {
      // Compress image to <= 1MB
      const compressedBase64 = await compressImageFile(file, 1);
      this.assetForm.patchValue({ photoBase64: compressedBase64 });
    } catch (err) {
      console.error('Error compressing image', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to process image. Try a smaller file.'
      });
    }
  }

  async saveAsset(): Promise<void> {
    if (this.assetForm.invalid) {
      this.assetForm.markAllAsTouched();
      return;
    }

    this.isSavingAsset = true;

    try {
      const formValue = this.assetForm.value;

      if (this.isEditing && this.editingAsset) {
        const updateData: any = {
          name: formValue.name,
          category: formValue.category,
          brand: formValue.brand || null,
          model: formValue.model || null,
          serialNumber: formValue.serialNumber || null,
          purchaseDate: Timestamp.fromDate(new Date(formValue.purchaseDate)),
          purchaseCost: formValue.purchaseCost,
          status: formValue.status,
          notes: formValue.notes || null,
          updatedAt: Timestamp.now()
        };

        // Only update photo if new one provided
        if (formValue.photoBase64) {
          updateData.photoUrl = formValue.photoBase64;
        }

        await this.assetService.updateAsset(this.editingAsset.id, updateData);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Asset updated successfully'
        });
      } else {
        const assetData = {
          name: formValue.name,
          category: formValue.category,
          brand: formValue.brand || null,
          model: formValue.model || null,
          serialNumber: formValue.serialNumber || null,
          purchaseDate: Timestamp.fromDate(new Date(formValue.purchaseDate)),
          purchaseCost: formValue.purchaseCost,
          status: formValue.status,
          notes: formValue.notes || null,
          photoUrl: formValue.photoBase64 || null,
          dateAdded: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        await this.assetService.addAsset(assetData);

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Asset added successfully'
        });
      }

      this.visibleDialog = false;
      this.assetForm.reset();
      this.editingAsset = null;

    } catch (error) {
      console.error('Error saving asset:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to save asset'
      });
    } finally {
      this.isSavingAsset = false;
    }
  }

  confirmDeleteAsset(asset: Asset): void {
    this.confirmationService.confirm({
      message: `Delete "${asset.name}" permanently?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteAsset(asset)
    });
  }

  async deleteAsset(asset: Asset): Promise<void> {
    try {
      await this.assetService.deleteAsset(asset.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Deleted',
        detail: 'Asset removed successfully'
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete asset'
      });
    }
  }

  viewImage(url?: string): void {
    if (url) {
      this.selectedImageUrl = url;
      this.visibleImageModal = true;
    }
  }

  getPreviewUrl(): string {
    return this.assetForm.value.photoBase64 || this.editingAsset?.photoUrl || '';
  }

  // Helper to convert Firestore Timestamp to Date
  toDate(timestamp: any): Date {
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    return timestamp instanceof Date ? timestamp : new Date(timestamp);
  }
}