// src/app/inventory/inventory.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TabsModule } from 'primeng/tabs';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';


import { combineLatest } from 'rxjs';

import { InventoryService } from '../../core/services/inventory.service';
import {
  Category,
  ConsolidatedStock,
  Item,
  RawMaterial,
  RawMaterialDisplay
} from '../../core/models/raw-material';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-inventory',
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
    TabsModule,
    ProgressSpinnerModule,
    CardModule,
    ToastModule,
    ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './inventory.component.html'
})
export class InventoryComponent implements OnInit {
  // Data
  inventory: ConsolidatedStock[] = [];
  purchaseHistory: RawMaterial[] = [];
  rawMaterials: RawMaterial[] = [];
  items: Item[] = [];
  categories: Category[] = [];

  // UI state
  isLoading = true;
  visibleDialog = false;
  visibleCategoryModal = false;
  visibleItemModal = false;
  visibleImageModal = false;
  selectedImageUrl = '';

  // Forms
  inventoryForm!: FormGroup;
  categoryForm!: FormGroup;
  itemForm!: FormGroup;

  // Dropdowns
  categoryOptions: SelectOption[] = [];
  filteredItemOptions: SelectOption[] = [];
  isEditingEntry = false;
  editingEntryId: string | null = null;


  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,

  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadData();
  }

  // ---------------- FORMS ----------------

  private initForms(): void {
    this.inventoryForm = this.fb.group({
      categoryId: ['', Validators.required],
      itemId: ['', Validators.required],
      quantityPurchaseUnits: [null, [Validators.required, Validators.min(1)]],
      unitSize: [null, [Validators.required, Validators.min(1)]],
      baseUnit: ['', Validators.required],
      purchaseUnit: ['', Validators.required],
      pricePerPurchaseUnit: [null, [Validators.required, Validators.min(0)]],
      lowStockThreshold: [null, [Validators.required, Validators.min(0)]],
      supplierName: [''],
      supplierContact: [''],
      notes: [''],
      photoBase64: ['']
    });

    this.categoryForm = this.fb.group({
      name: ['', Validators.required]
    });

    this.itemForm = this.fb.group({
      name: ['', Validators.required]
    });

    this.inventoryForm.get('categoryId')?.valueChanges.subscribe(val => {
      if (val === 'new') {
        this.visibleCategoryModal = true;
      } else {
        this.updateFilteredItemOptions();
      }
    });

    this.inventoryForm.get('itemId')?.valueChanges.subscribe(val => {
      if (val === 'new') {
        this.visibleItemModal = true;
      }
    });
  }

  // ---------------- DATA LOADING ----------------

  loadData(): void {
    this.isLoading = true;

    combineLatest([
      this.inventoryService.getConsolidatedStock(),
      this.inventoryService.getRawMaterials(),
      this.inventoryService.getCategories(),
      this.inventoryService.getItems()
    ]).subscribe({
      next: ([stock, raw, categories, items]) => {
        this.inventory = stock;
        this.categories = categories;
        this.items = items;
        this.purchaseHistory = raw.map(r => {
          const item = this.items.find(i => i.id === r.itemId);
          const category = this.categories.find(c => c.id === item?.categoryId);
          const categoryId = item?.categoryId || '';

          return {
            ...r,
            categoryId,
            itemName: item?.name || 'Unknown',
            categoryName: category?.name || 'Unknown'
          } as RawMaterialDisplay;
        });

        this.rawMaterials = raw;

        console.log({ stock, raw, categories, items });


        this.categoryOptions = [
          { label: 'Create New Category...', value: 'new' },
          ...categories.map(c => ({ label: c.name, value: c.id }))
        ];

        this.updateFilteredItemOptions();
        this.isLoading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to load inventory data'
        });
        this.isLoading = false;
      }
    });
  }

  showDialog(item: RawMaterialDisplay): void;
  showDialog(): void;
  showDialog(item?: RawMaterialDisplay): void {
    this.inventoryForm.reset();

    if (item) {
      this.isEditingEntry = true;
      this.editingEntryId = item.id;
      const quantityPurchaseUnits =
        item.unitSize > 0
          ? item.quantity / item.unitSize
          : 0;

      this.inventoryForm.patchValue({
        categoryId: item.categoryId,
        itemId: item.itemId,
        quantityPurchaseUnits,
        unitSize: item.unitSize,
        baseUnit: item.baseUnit,
        purchaseUnit: item.purchaseUnit,
        pricePerPurchaseUnit: item.purchasePrice,
        lowStockThreshold: item.lowStockThreshold,
        supplierName: item.supplierName,
        supplierContact: item.supplierContact,
        notes: item.notes ?? '',
        photoBase64: item.photoUrl ?? ''
      });
    }

    this.visibleDialog = true;
  }


  onFileChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.inventoryForm.patchValue({ photoBase64: reader.result });
    };
    reader.readAsDataURL(file);
  }

  // ---------------- DROPDOWNS ----------------

  updateFilteredItemOptions(): void {
    const categoryId = this.inventoryForm.get('categoryId')?.value;

    if (!categoryId || categoryId === 'new') {
      this.filteredItemOptions = [
        { label: 'Select category first', value: '' }
      ];
      return;
    }

    const filtered = this.items.filter(i => i.categoryId === categoryId);
    this.filteredItemOptions = [
      { label: 'Create New Item...', value: 'new' },
      ...filtered.map(i => ({ label: i.name, value: i.id }))
    ];
  }

  // ---------------- CREATE CATEGORY ----------------

  async addNewCategory(): Promise<void> {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    try {
      await this.inventoryService.addCategory({
        name: this.categoryForm.value.name.trim()
      });

      this.messageService.add({
        severity: 'success',
        detail: 'Category created'
      });

      this.visibleCategoryModal = false;
      this.categoryForm.reset();
      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to create category'
      });
    }
  }

  // ---------------- CREATE ITEM ----------------

  async addNewItem(): Promise<void> {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const categoryId = this.inventoryForm.get('categoryId')?.value;
    if (!categoryId || categoryId === 'new') {
      this.messageService.add({
        severity: 'warn',
        detail: 'Select a category first'
      });
      return;
    }

    try {
      await this.inventoryService.addItem({
        name: this.itemForm.value.name.trim(),
        categoryId
      });

      this.messageService.add({
        severity: 'success',
        detail: 'Item created'
      });

      this.visibleItemModal = false;
      this.itemForm.reset();
      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to create item'
      });
    }
  }

  // ---------------- ADD RAW MATERIAL ----------------

  async saveInventory(): Promise<void> {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    const f = this.inventoryForm.value;

    const rawMaterial: Omit<RawMaterial, 'id'> = {
      itemId: f.itemId,
      quantity: f.quantityPurchaseUnits * f.unitSize,
      unitSize: f.unitSize,
      baseUnit: f.baseUnit,
      purchaseUnit: f.purchaseUnit,
      purchasePrice: f.pricePerPurchaseUnit,
      lowStockThreshold: f.lowStockThreshold,
      supplierName: f.supplierName,
      supplierContact: f.supplierContact,
      purchaseDate: new Date(),
      dateAdded: new Date(),
      ...(f.notes && { notes: f.notes }),
      ...(f.photoBase64 && { photoUrl: f.photoBase64 })
    };
    console.log(rawMaterial);
    this.isEditingEntry ? this.updateInventoryEntry(rawMaterial) : this.createNewInventoryEntry(rawMaterial);
  }

  async createNewInventoryEntry(newRaw: Omit<RawMaterial, 'id'>): Promise<void> {
    try {
      await this.inventoryService.addRawMaterial(newRaw);
      this.visibleDialog = false;
      this.messageService.add({
        severity: 'success',
        detail: 'Stock added successfully'
      });
      this.inventoryForm.reset();
      this.selectedImageUrl = '';
      this.loadData();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to add stock'
      });
      console.error(error);
    }
  }

  async updateInventoryEntry(updatedRaw: Omit<RawMaterial, 'id'>): Promise<void> {
    if (this.editingEntryId) {
      try {
        await this.inventoryService.updateRawMaterial(this.editingEntryId, updatedRaw)
        this.visibleDialog = false;
        this.messageService.add({
          severity: 'success',
          detail: 'Stock entry updated successfully'
        });
        this.editingEntryId = null;
        this.isEditingEntry = false;
        this.inventoryForm.reset();
        this.selectedImageUrl = '';
        this.loadData();
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          detail: 'Failed to update stock entry'
        });
        console.error(error);
      };
    }
  }

  // ---------------- UI HELPERS ----------------

  getStatusClass(status: ConsolidatedStock['status']): string {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-orange-100 text-orange-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  viewImage(url?: string): void {
    if (url) {
      this.selectedImageUrl = url;
      this.visibleImageModal = true;
    }
  }

  getRawMaterialName(entry: RawMaterial): string {
    const item = this.items.find(i => i.id === entry.itemId);
    return item?.name || 'Unknown';
  }

  getQuantityAdded(entry: RawMaterial): string {
    const units = Math.floor(entry.quantity / entry.unitSize);
    const remainder = entry.quantity % entry.unitSize;

    if (remainder === 0) {
      return `${units} ${entry.purchaseUnit}${units !== 1 ? 's' : ''}`;
    }

    return `${units} ${entry.purchaseUnit}${units !== 1 ? 's' : ''} + ${remainder} ${entry.baseUnit}`;
  }

  getTotalCost(entry: RawMaterial): number {
    return (entry.quantity / entry.unitSize) * entry.purchasePrice;
  }

  getDateInMillis(timestamp: any): number {
    return timestamp?.seconds ? timestamp.seconds * 1000 : 0;
  }

  // ---------------- DELETE ITEM + HISTORY ----------------
  confirmDeleteEntry(entry: RawMaterialDisplay) {
    this.confirmationService.confirm({
      message: `Do you want to delete this ${entry.itemName} record?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        this.deletePurchaseEntry(entry)
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  async deletePurchaseEntry(entry: RawMaterialDisplay): Promise<void> {
    try {
      await this.inventoryService.deleteRawMaterial(entry.id);
      this.messageService.add({
        severity: 'success',
        detail: 'Purchase entry deleted'
      });
      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to delete purchase entry'
      });
    }
  }

  confirmDeleteItem(stock: ConsolidatedStock) {
    this.confirmationService.confirm({
      message: `${stock.item.name} and all purchase stock entries will be permanently deleted. Are you sure?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-info-circle',
      rejectLabel: 'Cancel',
      rejectButtonProps: {
        label: 'Cancel',
        severity: 'secondary',
        outlined: true,
      },
      acceptButtonProps: {
        label: 'Delete',
        severity: 'danger',
      },

      accept: () => {
        this.deleteItem(stock)
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
      },
    });
  }

  async deleteItem(stock: ConsolidatedStock): Promise<void> {
    try {
      const related = this.rawMaterials.filter(
        r => r.itemId === stock.item.id
      );

      // Delete all related raw materials
      for (const r of related) {
        await this.inventoryService.deleteRawMaterial(r.id);
      }

      // Delete the item itself
      await this.inventoryService.deleteItem(stock.id);

      this.messageService.add({
        severity: 'success',
        detail: 'Item and all stock entries removed'
      });

      this.loadData();
    } catch {
      this.messageService.add({
        severity: 'error',
        detail: 'Failed to delete item'
      });
    }
  }
}
